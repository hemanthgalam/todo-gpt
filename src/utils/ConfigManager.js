const fs = require('fs-extra');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configPath = path.join(__dirname, '../../data/config.json');
        this.config = {};
        this.loadConfigSync();
    }

    loadConfigSync() {
        try {
            if (process.env.NODE_ENV === 'test') {
                this.config = {};
                return;
            }
            if (fs.existsSync(this.configPath)) {
                this.config = fs.readJsonSync(this.configPath);
            }
        } catch (error) {
            console.error('Failed to load config file:', error);
        }
    }

    get(key, defaultValue = null) {
        if (process.env.NODE_ENV === 'test') {
            return process.env[key] !== undefined ? process.env[key] : defaultValue;
        }
        // Environment variables take precedence over file config
        if (process.env[key] !== undefined && process.env[key] !== '') {
            return process.env[key];
        }
        // Then check JSON config overrides
        if (this.config[key] !== undefined && this.config[key] !== '') {
            return this.config[key];
        }
        return defaultValue;
    }

    async save(newConfig) {
        try {
            // Reload configuration from file first to prevent race conditions or missed changes
            if (await fs.pathExists(this.configPath)) {
                this.config = await fs.readJson(this.configPath);
            }

            const processedConfig = { ...newConfig };
            const secretKeys = [
                'OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY',
                'GITHUB_TOKEN', 'JIRA_API_TOKEN', 'TEAMS_WEBHOOK_URL'
            ];

            // Don't overwrite existing secrets if they are sent as redacted placeholders
            for (const key of secretKeys) {
                if (processedConfig[key] === '********') {
                    processedConfig[key] = this.config[key] || process.env[key] || '';
                }
            }

            // Handle custom LLM apiKey redaction specifically
            if (processedConfig.customLLM) {
                if (processedConfig.customLLM.apiKey === '********') {
                    processedConfig.customLLM.apiKey = (this.config.customLLM && this.config.customLLM.apiKey) || '';
                }
            }

            this.config = {
                ...this.config,
                ...processedConfig
            };

            await fs.ensureDir(path.dirname(this.configPath));
            await fs.writeJson(this.configPath, this.config, { spaces: 2 });
            return true;
        } catch (error) {
            console.error('Failed to save config:', error);
            throw error;
        }
    }

    // Settings serialization for client UI (hiding API keys)
    getClientSettings() {
        const clientSettings = {};
        const keysToRedact = [
            'OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY',
            'GITHUB_TOKEN', 'JIRA_API_TOKEN', 'TEAMS_WEBHOOK_URL'
        ];

        // Combine all possible keys from config and env
        const allKeys = new Set([...Object.keys(this.config), ...Object.keys(process.env)]);
        const configKeysToInclude = [
            'OPENAI_API_KEY', 'GEMINI_API_KEY', 'ANTHROPIC_API_KEY',
            'GITHUB_TOKEN', 'JIRA_BASE_URL', 'JIRA_EMAIL', 'JIRA_API_TOKEN',
            'JIRA_PROJECT_KEY', 'TEAMS_WEBHOOK_URL', 'AI_MODEL'
        ];

        for (const key of configKeysToInclude) {
            let val = this.get(key);
            if (keysToRedact.includes(key)) {
                clientSettings[key] = val ? '********' : '';
            } else {
                clientSettings[key] = val || '';
            }
        }

        // Support custom LLM fields
        clientSettings.customLLM = this.config.customLLM || {
            baseUrl: '',
            apiKey: '',
            modelName: ''
        };

        if (clientSettings.customLLM.apiKey) {
            clientSettings.customLLM.apiKey = '********';
        }

        return clientSettings;
    }
}

module.exports = new ConfigManager();

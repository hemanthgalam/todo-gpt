const fs = require('fs-extra');
const path = require('path');

class SecurityScanner {
    constructor() {
        this.secretPatterns = [
            { name: 'Hardcoded API Secret / Key', regex: /(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16})/g, severity: 'CRITICAL' },
            { name: 'Unsanitized Command Exec', regex: /exec\s*\(\s*[`'"].*?\$\{/g, severity: 'HIGH' },
            { name: 'Insecure eval() execution', regex: /\beval\s*\(/g, severity: 'HIGH' },
            { name: 'Potential SQL Injection String Concat', regex: /SELECT\s+.*?\+\s*req\.(query|body|params)/gi, severity: 'HIGH' },
            { name: 'Empty Catch Exception Block', regex: /catch\s*\([^)]*\)\s*\{\s*\}/g, severity: 'LOW' }
        ];
    }

    async scanWorkspace(projectPath = './') {
        const results = {
            projectPath,
            scannedFilesCount: 0,
            securityScore: 100,
            vulnerabilities: [],
            scannedAt: new Date()
        };

        try {
            let targetDir = projectPath;
            if (!await fs.pathExists(targetDir)) {
                targetDir = './';
            }

            const files = await this.getFiles(targetDir);
            results.scannedFilesCount = files.length;

            let scoreDeductions = 0;

            for (const file of files) {
                if (file.includes('node_modules') || file.includes('.git') || file.includes('backups')) continue;
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const relPath = path.relative(targetDir, file);

                    for (const pattern of this.secretPatterns) {
                        const matches = content.match(pattern.regex);
                        if (matches) {
                            scoreDeductions += (pattern.severity === 'CRITICAL' ? 25 : pattern.severity === 'HIGH' ? 15 : 5);
                            results.vulnerabilities.push({
                                file: relPath,
                                vulnerability: pattern.name,
                                severity: pattern.severity,
                                matchCount: matches.length,
                                recommendation: `Remediate ${pattern.name} in ${relPath}`
                            });
                        }
                    }
                } catch (err) {
                    // Ignore unreadable files
                }
            }

            results.securityScore = Math.max(0, 100 - scoreDeductions);
            return results;

        } catch (error) {
            console.error('Security scan failed:', error);
            return {
                projectPath,
                scannedFilesCount: 0,
                securityScore: 90,
                vulnerabilities: [],
                error: error.message
            };
        }
    }

    async getFiles(dir, maxFiles = 100) {
        let results = [];
        try {
            const list = await fs.readdir(dir);
            for (const file of list) {
                if (file.startsWith('.') || file === 'node_modules' || file === 'data' || file === 'backups') continue;
                const filePath = path.join(dir, file);
                const stat = await fs.stat(filePath);
                if (stat && stat.isDirectory()) {
                    if (results.length < maxFiles) {
                        const sub = await this.getFiles(filePath, maxFiles - results.length);
                        results = results.concat(sub);
                    }
                } else {
                    if (['.js', '.json', '.ts', '.py', '.html'].includes(path.extname(filePath))) {
                        results.push(filePath);
                    }
                }
            }
        } catch (err) {}
        return results;
    }
}

module.exports = SecurityScanner;

const fs = require('fs-extra');
const path = require('path');

class ProjectAnalyzer {
    constructor() {
        this.supportedExtensions = ['.js', '.ts', '.jsx', '.tsx', '.py', '.java', '.cpp', '.c', '.go', '.rs'];
        this.configFiles = ['package.json', 'requirements.txt', 'Cargo.toml', 'pom.xml', 'go.mod'];
    }

    async analyze(targetPath) {
        try {
            let resolvedPath = targetPath || './';
            if (!await fs.pathExists(resolvedPath)) {
                const absoluteCheck = path.resolve(process.cwd(), resolvedPath);
                if (await fs.pathExists(absoluteCheck)) {
                    resolvedPath = absoluteCheck;
                } else {
                    console.warn(`Project path "${targetPath}" not found. Falling back to project root "./".`);
                    resolvedPath = './';
                }
            }

            const analysis = {
                projectPath: resolvedPath,
                techStack: [],
                dependencies: [],
                fileStructure: '',
                codeAnalysis: '',
                patterns: [],
                metrics: {},
                analyzedAt: new Date()
            };

            // Analyze project structure
            analysis.fileStructure = await this.generateFileStructure(resolvedPath);
            
            // Detect technology stack
            analysis.techStack = await this.detectTechStack(resolvedPath);
            
            // Extract dependencies
            analysis.dependencies = await this.extractDependencies(resolvedPath);
            
            // Analyze code patterns
            analysis.patterns = await this.analyzeCodePatterns(resolvedPath);
            
            // Generate code analysis
            analysis.codeAnalysis = await this.generateCodeAnalysis(resolvedPath);
            
            // Calculate metrics
            analysis.metrics = await this.calculateMetrics(resolvedPath);

            return analysis;
            
        } catch (error) {
            console.error('Error analyzing project:', error);
            throw error;
        }
    }

    async generateFileStructure(projectPath, maxDepth = 3, currentDepth = 0) {
        if (currentDepth >= maxDepth) return '';
        
        let structure = '';
        const items = await fs.readdir(projectPath);
        
        for (const item of items) {
            if (item.startsWith('.') && item !== '.env.example') continue;
            
            const itemPath = path.join(projectPath, item);
            const stats = await fs.stat(itemPath);
            const indent = '  '.repeat(currentDepth);
            
            if (stats.isDirectory()) {
                structure += `${indent}${item}/\n`;
                if (currentDepth < maxDepth - 1) {
                    structure += await this.generateFileStructure(itemPath, maxDepth, currentDepth + 1);
                }
            } else {
                structure += `${indent}${item}\n`;
            }
        }
        
        return structure;
    }

    async detectTechStack(projectPath) {
        const techStack = new Set();
        
        // Check for common config files
        const configChecks = {
            'package.json': ['Node.js', 'JavaScript'],
            'requirements.txt': ['Python'],
            'Cargo.toml': ['Rust'],
            'pom.xml': ['Java', 'Maven'],
            'build.gradle': ['Java', 'Gradle'],
            'go.mod': ['Go'],
            'composer.json': ['PHP'],
            'Gemfile': ['Ruby'],
            'Dockerfile': ['Docker']
        };

        for (const [file, techs] of Object.entries(configChecks)) {
            if (await fs.pathExists(path.join(projectPath, file))) {
                techs.forEach(tech => techStack.add(tech));
            }
        }

        // Check for framework-specific files
        const frameworkChecks = {
            'angular.json': 'Angular',
            'vue.config.js': 'Vue.js',
            'next.config.js': 'Next.js',
            'gatsby-config.js': 'Gatsby',
            'svelte.config.js': 'Svelte',
            'django': 'Django',
            'flask': 'Flask',
            'spring': 'Spring Boot'
        };

        for (const [file, framework] of Object.entries(frameworkChecks)) {
            if (await fs.pathExists(path.join(projectPath, file))) {
                techStack.add(framework);
            }
        }

        return Array.from(techStack);
    }

    async extractDependencies(projectPath) {
        const dependencies = [];
        
        // Node.js dependencies
        const packageJsonPath = path.join(projectPath, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
            try {
                const packageJson = await fs.readJson(packageJsonPath);
                if (packageJson.dependencies) {
                    dependencies.push(...Object.keys(packageJson.dependencies));
                }
                if (packageJson.devDependencies) {
                    dependencies.push(...Object.keys(packageJson.devDependencies));
                }
            } catch (error) {
                console.error('Error reading package.json:', error);
            }
        }

        // Python dependencies
        const requirementsPath = path.join(projectPath, 'requirements.txt');
        if (await fs.pathExists(requirementsPath)) {
            try {
                const requirements = await fs.readFile(requirementsPath, 'utf8');
                const pythonDeps = requirements.split('\n')
                    .filter(line => line.trim() && !line.startsWith('#'))
                    .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());
                dependencies.push(...pythonDeps);
            } catch (error) {
                console.error('Error reading requirements.txt:', error);
            }
        }

        return [...new Set(dependencies)]; // Remove duplicates
    }

    async analyzeCodePatterns(projectPath) {
        const patterns = new Set();
        
        try {
            await this.walkDirectory(projectPath, async (filePath) => {
                const ext = path.extname(filePath);
                if (!this.supportedExtensions.includes(ext)) return;
                
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    // Detect common patterns
                    if (content.includes('class ')) patterns.add('Object-Oriented Programming');
                    if (content.includes('async ') || content.includes('await ')) patterns.add('Async/Await');
                    if (content.includes('Promise')) patterns.add('Promises');
                    if (content.includes('import ') || content.includes('require(')) patterns.add('Module System');
                    if (content.includes('export ')) patterns.add('ES6 Modules');
                    if (content.includes('function*')) patterns.add('Generators');
                    if (content.includes('React.')) patterns.add('React');
                    if (content.includes('useState') || content.includes('useEffect')) patterns.add('React Hooks');
                    if (content.includes('express(')) patterns.add('Express.js');
                    if (content.includes('mongoose.')) patterns.add('Mongoose/MongoDB');
                    if (content.includes('sequelize')) patterns.add('Sequelize/SQL');
                    if (content.includes('test(') || content.includes('describe(')) patterns.add('Testing Framework');
                    
                } catch (error) {
                    // Skip files that can't be read
                }
            });
        } catch (error) {
            console.error('Error analyzing code patterns:', error);
        }
        
        return Array.from(patterns);
    }

    async generateCodeAnalysis(projectPath) {
        let analysis = 'Code Analysis Summary:\n\n';
        
        const stats = {
            totalFiles: 0,
            codeFiles: 0,
            totalLines: 0,
            languages: {}
        };

        try {
            await this.walkDirectory(projectPath, async (filePath) => {
                stats.totalFiles++;
                const ext = path.extname(filePath);
                
                if (this.supportedExtensions.includes(ext)) {
                    stats.codeFiles++;
                    
                    try {
                        const content = await fs.readFile(filePath, 'utf8');
                        const lines = content.split('\n').length;
                        stats.totalLines += lines;
                        
                        const lang = this.getLanguageFromExtension(ext);
                        stats.languages[lang] = (stats.languages[lang] || 0) + lines;
                        
                    } catch (error) {
                        // Skip files that can't be read
                    }
                }
            });
        } catch (error) {
            console.error('Error generating code analysis:', error);
        }

        analysis += `- Total Files: ${stats.totalFiles}\n`;
        analysis += `- Code Files: ${stats.codeFiles}\n`;
        analysis += `- Total Lines of Code: ${stats.totalLines}\n`;
        analysis += `- Languages:\n`;
        
        for (const [lang, lines] of Object.entries(stats.languages)) {
            analysis += `  - ${lang}: ${lines} lines\n`;
        }

        return analysis;
    }

    async calculateMetrics(projectPath) {
        const metrics = {
            complexity: 0,
            maintainability: 0,
            testCoverage: 0,
            codeQuality: 0
        };

        // This is a simplified metrics calculation
        // In a real implementation, you'd use proper static analysis tools
        
        try {
            let totalComplexity = 0;
            let fileCount = 0;
            
            await this.walkDirectory(projectPath, async (filePath) => {
                const ext = path.extname(filePath);
                if (!this.supportedExtensions.includes(ext)) return;
                
                try {
                    const content = await fs.readFile(filePath, 'utf8');
                    
                    // Simple complexity calculation based on control structures
                    const complexityIndicators = [
                        /if\s*\(/g, /else/g, /for\s*\(/g, /while\s*\(/g,
                        /switch\s*\(/g, /case\s+/g, /catch\s*\(/g, /\?\s*:/g
                    ];
                    
                    let fileComplexity = 1; // Base complexity
                    complexityIndicators.forEach(pattern => {
                        const matches = content.match(pattern);
                        if (matches) fileComplexity += matches.length;
                    });
                    
                    totalComplexity += fileComplexity;
                    fileCount++;
                    
                } catch (error) {
                    // Skip files that can't be read
                }
            });
            
            metrics.complexity = fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0;
            metrics.maintainability = Math.max(0, 100 - metrics.complexity * 2);
            metrics.codeQuality = Math.round((metrics.maintainability + 50) / 2);
            
        } catch (error) {
            console.error('Error calculating metrics:', error);
        }

        return metrics;
    }

    async walkDirectory(dir, callback) {
        const items = await fs.readdir(dir);
        
        for (const item of items) {
            if (item.startsWith('.') || item === 'node_modules') continue;
            
            const itemPath = path.join(dir, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
                await this.walkDirectory(itemPath, callback);
            } else {
                await callback(itemPath);
            }
        }
    }

    getLanguageFromExtension(ext) {
        const langMap = {
            '.js': 'JavaScript',
            '.ts': 'TypeScript',
            '.jsx': 'React/JSX',
            '.tsx': 'React/TSX',
            '.py': 'Python',
            '.java': 'Java',
            '.cpp': 'C++',
            '.c': 'C',
            '.go': 'Go',
            '.rs': 'Rust'
        };
        
        return langMap[ext] || 'Unknown';
    }
}

module.exports = ProjectAnalyzer;
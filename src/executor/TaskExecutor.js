const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

class TaskExecutor {
    constructor() {
        this.backupDir = path.join(__dirname, '../../backups');
        this.ensureBackupDirectory();
    }

    async ensureBackupDirectory() {
        await fs.ensureDir(this.backupDir);
    }

    async execute(plan) {
        const executionResult = {
            planId: plan.taskId,
            status: 'started',
            steps: [],
            startTime: new Date(),
            endTime: null,
            success: false,
            error: null,
            backupId: null
        };

        try {
            // Create backup before execution
            executionResult.backupId = await this.createBackup(plan.taskId);
            
            // Install dependencies if needed
            if (plan.dependencies && plan.dependencies.length > 0) {
                await this.installDependencies(plan.dependencies);
            }

            // Execute each step
            for (const step of plan.steps) {
                const stepResult = await this.executeStep(step, plan);
                executionResult.steps.push(stepResult);
                
                if (!stepResult.success) {
                    throw new Error(`Step ${step.id} failed: ${stepResult.error}`);
                }
            }

            // Run tests if specified
            if (plan.runTests) {
                const testResult = await this.runTests();
                executionResult.testResult = testResult;
            }

            executionResult.status = 'completed';
            executionResult.success = true;
            executionResult.endTime = new Date();

        } catch (error) {
            console.error('Execution failed:', error);
            executionResult.status = 'failed';
            executionResult.error = error.message;
            executionResult.endTime = new Date();
            
            // Restore from backup on failure
            if (executionResult.backupId) {
                await this.restoreBackup(executionResult.backupId);
            }
        }

        return executionResult;
    }

    async executeStep(step, plan) {
        const stepResult = {
            stepId: step.id,
            description: step.description,
            action: step.action,
            file: step.file,
            success: false,
            error: null,
            startTime: new Date(),
            endTime: null
        };

        try {
            switch (step.action) {
                case 'create':
                    await this.createFile(step.file, step.code);
                    break;
                    
                case 'modify':
                    await this.modifyFile(step.file, step.code, step.modifications);
                    break;
                    
                case 'delete':
                    await this.deleteFile(step.file);
                    break;
                    
                case 'command':
                    await this.executeCommand(step.command, step.workingDir);
                    break;
                    
                default:
                    throw new Error(`Unknown action: ${step.action}`);
            }

            stepResult.success = true;
            stepResult.endTime = new Date();

        } catch (error) {
            console.error(`Step ${step.id} failed:`, error);
            stepResult.error = error.message;
            stepResult.endTime = new Date();
        }

        return stepResult;
    }

    async createFile(filePath, content) {
        try {
            // Ensure directory exists
            await fs.ensureDir(path.dirname(filePath));
            
            // Write file
            await fs.writeFile(filePath, content, 'utf8');
            
            console.log(`Created file: ${filePath}`);
        } catch (error) {
            throw new Error(`Failed to create file ${filePath}: ${error.message}`);
        }
    }

    async modifyFile(filePath, newContent, modifications) {
        try {
            if (!await fs.pathExists(filePath)) {
                throw new Error(`File does not exist: ${filePath}`);
            }

            if (modifications && modifications.length > 0) {
                // Apply specific modifications
                let content = await fs.readFile(filePath, 'utf8');
                
                for (const mod of modifications) {
                    switch (mod.type) {
                        case 'replace':
                            content = content.replace(mod.search, mod.replace);
                            break;
                        case 'insert':
                            const lines = content.split('\n');
                            lines.splice(mod.line, 0, mod.content);
                            content = lines.join('\n');
                            break;
                        case 'append':
                            content += '\n' + mod.content;
                            break;
                    }
                }
                
                await fs.writeFile(filePath, content, 'utf8');
            } else {
                // Replace entire file content
                await fs.writeFile(filePath, newContent, 'utf8');
            }
            
            console.log(`Modified file: ${filePath}`);
        } catch (error) {
            throw new Error(`Failed to modify file ${filePath}: ${error.message}`);
        }
    }

    async deleteFile(filePath) {
        try {
            if (await fs.pathExists(filePath)) {
                await fs.remove(filePath);
                console.log(`Deleted file: ${filePath}`);
            }
        } catch (error) {
            throw new Error(`Failed to delete file ${filePath}: ${error.message}`);
        }
    }

    async executeCommand(command, workingDir = process.cwd()) {
        try {
            const { stdout, stderr } = await execAsync(command, { 
                cwd: workingDir,
                timeout: 30000 // 30 second timeout
            });
            
            console.log(`Command executed: ${command}`);
            if (stdout) console.log('STDOUT:', stdout);
            if (stderr) console.log('STDERR:', stderr);
            
            return { stdout, stderr };
        } catch (error) {
            throw new Error(`Command failed: ${command}\nError: ${error.message}`);
        }
    }

    async installDependencies(dependencies) {
        try {
            // Check if package.json exists
            if (await fs.pathExists('package.json')) {
                const installCmd = `npm install ${dependencies.join(' ')}`;
                await this.executeCommand(installCmd);
            } else if (await fs.pathExists('requirements.txt')) {
                const installCmd = `pip install ${dependencies.join(' ')}`;
                await this.executeCommand(installCmd);
            } else {
                console.log('No package manager detected, skipping dependency installation');
            }
        } catch (error) {
            console.error('Failed to install dependencies:', error);
            // Don't throw error, just log it
        }
    }

    async runTests() {
        try {
            let testCommand = '';
            
            if (await fs.pathExists('package.json')) {
                const packageJson = await fs.readJson('package.json');
                if (packageJson.scripts && packageJson.scripts.test) {
                    testCommand = 'npm test';
                }
            } else if (await fs.pathExists('pytest.ini') || await fs.pathExists('test_*.py')) {
                testCommand = 'pytest';
            }

            if (testCommand) {
                const result = await this.executeCommand(testCommand);
                return {
                    success: true,
                    output: result.stdout,
                    error: result.stderr
                };
            } else {
                return {
                    success: true,
                    output: 'No tests found to run',
                    error: null
                };
            }
        } catch (error) {
            return {
                success: false,
                output: null,
                error: error.message
            };
        }
    }

    async createBackup(taskId) {
        try {
            const backupId = `backup_${taskId}_${Date.now()}`;
            const backupPath = path.join(this.backupDir, backupId);
            
            // Create backup of current working directory
            await fs.copy(process.cwd(), backupPath, {
                filter: (src) => {
                    // Exclude node_modules, .git, and other large directories
                    const relativePath = path.relative(process.cwd(), src);
                    return !relativePath.includes('node_modules') && 
                           !relativePath.includes('.git') &&
                           !relativePath.includes('backups');
                }
            });
            
            console.log(`Created backup: ${backupId}`);
            return backupId;
        } catch (error) {
            console.error('Failed to create backup:', error);
            return null;
        }
    }

    async restoreBackup(backupId) {
        try {
            const backupPath = path.join(this.backupDir, backupId);
            
            if (await fs.pathExists(backupPath)) {
                // Clear current directory (except node_modules and .git)
                const items = await fs.readdir(process.cwd());
                for (const item of items) {
                    if (item !== 'node_modules' && item !== '.git' && item !== 'backups') {
                        await fs.remove(path.join(process.cwd(), item));
                    }
                }
                
                // Restore from backup
                await fs.copy(backupPath, process.cwd());
                console.log(`Restored from backup: ${backupId}`);
            }
        } catch (error) {
            console.error('Failed to restore backup:', error);
        }
    }

    async cleanupOldBackups(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
        try {
            const backups = await fs.readdir(this.backupDir);
            const now = Date.now();
            
            for (const backup of backups) {
                const backupPath = path.join(this.backupDir, backup);
                const stats = await fs.stat(backupPath);
                
                if (now - stats.mtime.getTime() > maxAge) {
                    await fs.remove(backupPath);
                    console.log(`Cleaned up old backup: ${backup}`);
                }
            }
        } catch (error) {
            console.error('Failed to cleanup old backups:', error);
        }
    }
}

module.exports = TaskExecutor;
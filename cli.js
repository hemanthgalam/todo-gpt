#!/usr/bin/env node

const readline = require('readline');
const CalendarManager = require('./src/calendar/CalendarManager');
const AIAgent = require('./src/agent/AIAgent');
const ProjectAnalyzer = require('./src/analyzer/ProjectAnalyzer');
const TaskExecutor = require('./src/executor/TaskExecutor');

class TodoGPTCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.calendarManager = new CalendarManager();
        this.aiAgent = new AIAgent();
        this.projectAnalyzer = new ProjectAnalyzer();
        this.taskExecutor = new TaskExecutor();
    }

    async start() {
        console.log('🤖 Welcome to Todo-GPT CLI!');
        console.log('Available commands:');
        console.log('  1. schedule - Schedule a new task');
        console.log('  2. list - List all tasks');
        console.log('  3. analyze - Analyze a project');
        console.log('  4. execute - Execute a task manually');
        console.log('  5. help - Show this help');
        console.log('  6. exit - Exit the CLI');
        console.log('');

        this.showPrompt();
    }

    showPrompt() {
        this.rl.question('todo-gpt> ', async (input) => {
            const command = input.trim().toLowerCase();
            
            try {
                switch (command) {
                    case '1':
                    case 'schedule':
                        await this.scheduleTask();
                        break;
                    case '2':
                    case 'list':
                        await this.listTasks();
                        break;
                    case '3':
                    case 'analyze':
                        await this.analyzeProject();
                        break;
                    case '4':
                    case 'execute':
                        await this.executeTask();
                        break;
                    case '5':
                    case 'help':
                        await this.start();
                        return;
                    case '6':
                    case 'exit':
                        console.log('Goodbye! 👋');
                        this.rl.close();
                        return;
                    default:
                        console.log('Unknown command. Type "help" for available commands.');
                }
            } catch (error) {
                console.error('Error:', error.message);
            }
            
            this.showPrompt();
        });
    }

    async scheduleTask() {
        console.log('\n📅 Schedule New Task');
        
        const title = await this.question('Task title: ');
        const taskType = await this.question('Task type (feature/bugfix/refactor): ');
        const priority = await this.question('Priority (low/medium/high/urgent): ') || 'medium';
        const projectPath = await this.question('Project path: ');
        const description = await this.question('Description: ');
        
        // Schedule for 5 minutes from now for testing
        const scheduledTime = new Date();
        scheduledTime.setMinutes(scheduledTime.getMinutes() + 5);

        const taskData = {
            title,
            taskType,
            priority,
            projectPath,
            description,
            scheduledTime: scheduledTime.toISOString(),
            requirements: []
        };

        try {
            const event = await this.calendarManager.createEvent(taskData);
            console.log(`✅ Task scheduled successfully! ID: ${event.id}`);
            console.log(`⏰ Scheduled for: ${new Date(event.scheduledTime).toLocaleString()}`);
        } catch (error) {
            console.error('❌ Failed to schedule task:', error.message);
        }
    }

    async listTasks() {
        console.log('\n📋 All Tasks');
        
        try {
            const events = await this.calendarManager.getEvents();
            
            if (events.length === 0) {
                console.log('No tasks found.');
                return;
            }

            events.forEach((event, index) => {
                console.log(`\n${index + 1}. ${event.title}`);
                console.log(`   Status: ${event.status}`);
                console.log(`   Type: ${event.taskType}`);
                console.log(`   Priority: ${event.priority}`);
                console.log(`   Scheduled: ${new Date(event.scheduledTime).toLocaleString()}`);
                console.log(`   Project: ${event.projectPath}`);
                if (event.description) {
                    console.log(`   Description: ${event.description}`);
                }
            });
        } catch (error) {
            console.error('❌ Failed to list tasks:', error.message);
        }
    }

    async analyzeProject() {
        console.log('\n🔍 Analyze Project');
        
        const projectPath = await this.question('Project path to analyze: ');
        
        try {
            console.log('Analyzing project...');
            const analysis = await this.projectAnalyzer.analyze(projectPath);
            
            console.log('\n📊 Analysis Results:');
            console.log(`Tech Stack: ${analysis.techStack.join(', ')}`);
            console.log(`Dependencies: ${analysis.dependencies.slice(0, 10).join(', ')}${analysis.dependencies.length > 10 ? '...' : ''}`);
            console.log(`Patterns: ${analysis.patterns.join(', ')}`);
            console.log('\nFile Structure:');
            console.log(analysis.fileStructure);
            console.log('\nCode Analysis:');
            console.log(analysis.codeAnalysis);
        } catch (error) {
            console.error('❌ Failed to analyze project:', error.message);
        }
    }

    async executeTask() {
        console.log('\n⚡ Execute Task');
        
        try {
            const events = await this.calendarManager.getEvents();
            const scheduledTasks = events.filter(e => e.status === 'scheduled');
            
            if (scheduledTasks.length === 0) {
                console.log('No scheduled tasks found.');
                return;
            }

            console.log('\nScheduled Tasks:');
            scheduledTasks.forEach((task, index) => {
                console.log(`${index + 1}. ${task.title} (${task.taskType})`);
            });

            const choice = await this.question('\nSelect task number to execute: ');
            const taskIndex = parseInt(choice) - 1;
            
            if (taskIndex < 0 || taskIndex >= scheduledTasks.length) {
                console.log('Invalid task number.');
                return;
            }

            const task = scheduledTasks[taskIndex];
            console.log(`\nExecuting task: ${task.title}`);
            
            // Mark as started
            await this.calendarManager.markTaskAsStarted(task.id);
            
            // Analyze project
            console.log('1. Analyzing project...');
            const projectContext = await this.projectAnalyzer.analyze(task.projectPath);
            
            // Generate plan
            console.log('2. Generating implementation plan...');
            const plan = await this.aiAgent.generatePlan(task, projectContext);
            
            console.log('3. Generated plan:');
            console.log(`   Analysis: ${plan.analysis}`);
            console.log(`   Steps: ${plan.steps.length}`);
            console.log(`   Estimated time: ${plan.estimatedTime} minutes`);
            
            const confirm = await this.question('\nExecute this plan? (y/n): ');
            if (confirm.toLowerCase() !== 'y') {
                console.log('Execution cancelled.');
                return;
            }
            
            // Execute plan
            console.log('4. Executing plan...');
            const result = await this.taskExecutor.execute(plan);
            
            if (result.success) {
                await this.calendarManager.markTaskAsCompleted(task.id, result);
                console.log('✅ Task completed successfully!');
            } else {
                await this.calendarManager.markTaskAsFailed(task.id, result.error);
                console.log('❌ Task execution failed:', result.error);
            }
            
        } catch (error) {
            console.error('❌ Failed to execute task:', error.message);
        }
    }

    question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, resolve);
        });
    }
}

// Start CLI if run directly
if (require.main === module) {
    const cli = new TodoGPTCLI();
    cli.start().catch(console.error);
}

module.exports = TodoGPTCLI;
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
require('dotenv').config();

// Import Swagger documentation
const { swaggerDocs } = require('./swagger');

const CalendarManager = require('./calendar/CalendarManager');
const AIAgent = require('./agent/AIAgent');
const ProjectAnalyzer = require('./analyzer/ProjectAnalyzer');
const TaskExecutor = require('./executor/TaskExecutor');
const IntegrationManager = require('./integrations/IntegrationManager');

class TodoGPT {
    constructor() {
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = socketIo(this.server, {
            cors: { origin: "*", methods: ["GET", "POST"] }
        });
        
        this.calendarManager = new CalendarManager();
        this.aiAgent = new AIAgent();
        this.projectAnalyzer = new ProjectAnalyzer();
        this.taskExecutor = new TaskExecutor();
        this.integrationManager = new IntegrationManager();
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupSocketHandlers();
        this.startScheduler();
    }

    setupMiddleware() {
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.static('public'));
        
        // Initialize Swagger documentation
        swaggerDocs(this.app);
    }

    setupRoutes() {
        // Calendar routes
        this.app.get('/api/calendar/events', async (req, res) => {
            try {
                const events = await this.calendarManager.getEvents();
                res.json(events);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/calendar/events', async (req, res) => {
            try {
                const event = await this.calendarManager.createEvent(req.body);
                res.json(event);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Project routes
        this.app.post('/api/project/analyze', async (req, res) => {
            try {
                const analysis = await this.projectAnalyzer.analyze(req.body.projectPath);
                res.json(analysis);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Task execution routes
        this.app.post('/api/tasks/execute', async (req, res) => {
            try {
                const result = await this.taskExecutor.execute(req.body);
                res.json(result);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Integration routes
        this.app.get('/api/integrations/status', async (req, res) => {
            try {
                const status = this.integrationManager.getIntegrationStatus();
                res.json(status);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/api/integrations/test', async (req, res) => {
            try {
                const results = await this.integrationManager.testIntegrations();
                res.json(results);
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Webhook endpoints
        this.app.post('/webhooks/github', async (req, res) => {
            try {
                await this.integrationManager.handleGitHubWebhook(req.body);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error('GitHub webhook error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        this.app.post('/webhooks/jira', async (req, res) => {
            try {
                await this.integrationManager.handleJiraWebhook(req.body);
                res.status(200).json({ success: true });
            } catch (error) {
                console.error('JIRA webhook error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // JIRA sync route
        this.app.post('/api/jira/sync/:jiraKey', async (req, res) => {
            try {
                const task = await this.integrationManager.syncJiraToTodoGPT(req.params.jiraKey);
                if (task) {
                    // Create event in calendar
                    const event = await this.calendarManager.createEvent({
                        ...task,
                        scheduledTime: new Date(Date.now() + 60000) // Schedule for 1 minute from now
                    });
                    res.json(event);
                } else {
                    res.status(404).json({ error: 'JIRA ticket not found' });
                }
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Teams webhook test route
        this.app.post('/api/teams/test', async (req, res) => {
            try {
                const success = await this.integrationManager.teams.testConnection();
                res.json({ success });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });

        // Daily digest route
        this.app.post('/api/teams/digest', async (req, res) => {
            try {
                const stats = await this.generateDailyStats();
                const success = await this.integrationManager.teams.notifyDailyDigest(stats);
                res.json({ success, stats });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
    }

    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log('Client connected:', socket.id);
            
            socket.on('task_progress', (data) => {
                this.io.emit('task_update', data);
            });
            
            socket.on('disconnect', () => {
                console.log('Client disconnected:', socket.id);
            });
        });
    }

    startScheduler() {
        // Check for scheduled tasks every minute
        const cron = require('node-cron');
        cron.schedule('* * * * *', async () => {
            await this.processScheduledTasks();
        });

        // Send daily digest at 9 AM (configurable via environment)
        const digestTime = process.env.TEAMS_DIGEST_TIME || '0 9 * * *';
        if (process.env.TEAMS_DAILY_DIGEST === 'true') {
            cron.schedule(digestTime, async () => {
                await this.sendDailyDigest();
            });
        }
    }

    async processScheduledTasks() {
        try {
            const upcomingTasks = await this.calendarManager.getUpcomingTasks();
            
            for (const task of upcomingTasks) {
                if (task.shouldExecute) {
                    console.log(`Executing scheduled task: ${task.title}`);
                    await this.executeTask(task);
                }
            }
        } catch (error) {
            console.error('Error processing scheduled tasks:', error);
        }
    }

    async generateDailyStats() {
        try {
            const events = await this.calendarManager.getEvents();
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            // Filter events for today
            const todayEvents = events.filter(event => {
                const eventDate = new Date(event.createdAt || event.scheduledTime);
                return eventDate >= startOfDay && eventDate < endOfDay;
            });

            const completedTasks = todayEvents.filter(e => e.status === 'completed');
            const failedTasks = todayEvents.filter(e => e.status === 'failed');
            const totalTasks = completedTasks.length + failedTasks.length;

            // Calculate average completion time
            let totalDuration = 0;
            let tasksWithDuration = 0;
            
            completedTasks.forEach(task => {
                if (task.result && task.result.startTime && task.result.endTime) {
                    const duration = new Date(task.result.endTime) - new Date(task.result.startTime);
                    totalDuration += duration;
                    tasksWithDuration++;
                }
            });

            const averageCompletionTime = tasksWithDuration > 0 
                ? this.formatDuration(totalDuration / tasksWithDuration)
                : 'N/A';

            return {
                tasksCompleted: completedTasks.length,
                tasksFailed: failedTasks.length,
                pullRequestsCreated: completedTasks.filter(t => t.result?.integrations?.pullRequest).length,
                jiraTicketsUpdated: completedTasks.filter(t => t.result?.integrations?.jiraTicket).length,
                successRate: totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0,
                averageCompletionTime: averageCompletionTime,
                date: today.toLocaleDateString()
            };
        } catch (error) {
            console.error('Error generating daily stats:', error);
            return {
                tasksCompleted: 0,
                tasksFailed: 0,
                pullRequestsCreated: 0,
                jiraTicketsUpdated: 0,
                successRate: 0,
                averageCompletionTime: 'N/A',
                date: new Date().toLocaleDateString()
            };
        }
    }

    async sendDailyDigest() {
        try {
            const stats = await this.generateDailyStats();
            
            // Only send digest if there was activity
            if (stats.tasksCompleted > 0 || stats.tasksFailed > 0) {
                await this.integrationManager.teams.notifyDailyDigest(stats);
                console.log('Daily digest sent to Teams');
            }
        } catch (error) {
            console.error('Error sending daily digest:', error);
        }
    }

    formatDuration(milliseconds) {
        const minutes = Math.floor(milliseconds / 60000);
        const seconds = Math.floor((milliseconds % 60000) / 1000);
        
        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    async executeTask(task) {
        try {
            // Mark task as started
            await this.calendarManager.markTaskAsStarted(task.id);
            
            // Send Teams notification for task start
            await this.integrationManager.notifyTaskStarted(task);
            
            this.io.emit('task_update', {
                taskId: task.id,
                status: 'analyzing',
                message: 'Analyzing project context...',
                timestamp: new Date()
            });

            // Analyze project context
            const projectContext = await this.projectAnalyzer.analyze(task.projectPath);
            
            this.io.emit('task_update', {
                taskId: task.id,
                status: 'planning',
                message: 'Generating implementation plan...',
                timestamp: new Date()
            });

            // Generate implementation plan
            const plan = await this.aiAgent.generatePlan(task, projectContext);
            
            this.io.emit('task_update', {
                taskId: task.id,
                status: 'executing',
                message: 'Executing implementation plan...',
                timestamp: new Date()
            });

            // Execute the plan
            const result = await this.taskExecutor.execute(plan);
            
            // Enhance result with task information for integrations
            const enhancedResult = {
                ...result,
                taskId: task.id,
                title: task.title,
                description: task.description,
                taskType: task.taskType,
                priority: task.priority,
                projectPath: task.projectPath,
                requirements: task.requirements,
                scheduledTime: task.scheduledTime
            };

            this.io.emit('task_update', {
                taskId: task.id,
                status: 'integrating',
                message: 'Processing integrations (JIRA/GitHub)...',
                timestamp: new Date()
            });

            // Process integrations (JIRA ticket + GitHub PR)
            const integrationResult = await this.integrationManager.processTaskCompletion(enhancedResult);
            
            // Update task status based on execution result
            if (result.success) {
                await this.calendarManager.markTaskAsCompleted(task.id, {
                    ...result,
                    integrations: integrationResult
                });
            } else {
                await this.calendarManager.markTaskAsFailed(task.id, result.error);
            }

            // Notify completion with integration details
            this.io.emit('task_completed', {
                taskId: task.id,
                result: result,
                integrations: integrationResult,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error(`Error executing task ${task.id}:`, error);
            
            // Mark task as failed
            await this.calendarManager.markTaskAsFailed(task.id, error.message);
            
            this.io.emit('task_error', {
                taskId: task.id,
                error: error.message,
                timestamp: new Date()
            });
        }
    }

    start(port = 3000) {
        this.server.listen(port, () => {
            console.log(`Todo-GPT server running on port ${port}`);
            console.log(`Web interface: http://localhost:${port}`);
        });
    }
}

// Start the application
const todoGPT = new TodoGPT();
todoGPT.start();

module.exports = TodoGPT;
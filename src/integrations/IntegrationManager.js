const GitHubIntegration = require('./GitHubIntegration');
const JiraIntegration = require('./JiraIntegration');
const TeamsIntegration = require('./TeamsIntegration');
const Logger = require('../utils/Logger');
class IntegrationManager {
    constructor(app) {
        this.app = app;
        this.github = new GitHubIntegration();
        this.jira = new JiraIntegration();
        this.teams = new TeamsIntegration();
        this.logger = Logger;
    }

    async processTaskCompletion(taskResult) {
        const integrationResult = {
            taskId: taskResult.taskId,
            jiraTicket: null,
            pullRequest: null,
            success: false,
            errors: []
        };

        try {
            // Step 1: Create JIRA ticket if integration is configured
            if (this.jira.isConfigured()) {
                try {
                    this.logger.info('Creating JIRA ticket for task', { taskId: taskResult.taskId });
                    
                    integrationResult.jiraTicket = await this.jira.createTicket({
                        title: taskResult.title,
                        description: taskResult.description,
                        taskType: taskResult.taskType,
                        priority: taskResult.priority,
                        projectPath: taskResult.projectPath,
                        requirements: taskResult.requirements || [],
                        scheduledTime: taskResult.scheduledTime,
                        assignee: taskResult.assignee
                    });

                    // Update ticket status to "In Progress"
                    await this.jira.updateTicketStatus(
                        integrationResult.jiraTicket.key, 
                        'In Progress',
                        'Task execution started by Todo-GPT'
                    );

                } catch (error) {
                    this.logger.error('Failed to create JIRA ticket', { error: error.message });
                    integrationResult.errors.push(`JIRA: ${error.message}`);
                }
            }

            // Step 2: Create Pull Request if task was successful
            if (taskResult.success) {
                try {
                    this.logger.info('Creating GitHub PR for task', { taskId: taskResult.taskId });
                    
                    // Enhance task result with file changes info
                    const enhancedResult = await this.enhanceTaskResult(taskResult);
                    
                    const prResult = await this.github.createPullRequest(
                        enhancedResult, 
                        integrationResult.jiraTicket
                    );

                    if (prResult.success) {
                        integrationResult.pullRequest = prResult;
                        
                        // Link PR to JIRA ticket
                        if (integrationResult.jiraTicket) {
                            await this.jira.linkPullRequest(
                                integrationResult.jiraTicket.key,
                                prResult.prUrl,
                                enhancedResult.title
                            );

                            // Update JIRA ticket status to "In Review"
                            await this.jira.updateTicketStatus(
                                integrationResult.jiraTicket.key,
                                'In Review',
                                `Pull request created: ${prResult.prUrl}`
                            );
                        }

                        // Send Teams notification for PR creation
                        if (this.teams.isConfigured()) {
                            await this.teams.notifyPullRequestCreated(
                                enhancedResult,
                                prResult,
                                integrationResult.jiraTicket
                            );
                        }

                        this.logger.info('Successfully created PR', { 
                            prUrl: prResult.prUrl,
                            prNumber: prResult.prNumber 
                        });

                    } else {
                        integrationResult.errors.push(`GitHub: ${prResult.error}`);
                    }

                } catch (error) {
                    this.logger.error('Failed to create PR', { error: error.message });
                    integrationResult.errors.push(`GitHub: ${error.message}`);
                }
            } else {
                // Task failed, update JIRA ticket accordingly
                if (integrationResult.jiraTicket) {
                    await this.jira.updateTicketStatus(
                        integrationResult.jiraTicket.key,
                        'To Do',
                        `Task execution failed: ${taskResult.error}`
                    );
                }
            }

            // Step 3: Send Teams notification for task completion
            if (this.teams.isConfigured()) {
                await this.teams.notifyTaskCompleted(taskResult, taskResult, integrationResult);
            }

            integrationResult.success = integrationResult.errors.length === 0;
            return integrationResult;

        } catch (error) {
            this.logger.error('Integration processing failed', { error: error.message });
            integrationResult.errors.push(`General: ${error.message}`);
            
            // Send Teams error notification
            if (this.teams.isConfigured()) {
                await this.teams.notifyError(error, `Task: ${taskResult.title}`);
            }
            
            return integrationResult;
        }
    }

    async enhanceTaskResult(taskResult) {
        // Add information about files that were changed
        const filesChanged = [];
        
        if (taskResult.steps) {
            for (const step of taskResult.steps) {
                if (step.file && step.success) {
                    filesChanged.push(step.file);
                }
            }
        }

        return {
            ...taskResult,
            filesChanged: [...new Set(filesChanged)] // Remove duplicates
        };
    }

    async handlePRMerged(prData) {
        try {
            // Extract JIRA ticket key from PR title or branch name
            const jiraKey = this.extractJiraKey(prData.title, prData.head.ref);
            
            if (jiraKey && this.jira.isConfigured()) {
                // Update JIRA ticket to "Done"
                await this.jira.updateTicketStatus(
                    jiraKey,
                    'Done',
                    `Pull request merged: ${prData.html_url}`
                );

                this.logger.info('Updated JIRA ticket after PR merge', { jiraKey });
            }

            // Send Teams notification for PR merge
            if (this.teams.isConfigured()) {
                await this.teams.notifyPullRequestMerged(prData);
            }

        } catch (error) {
            this.logger.error('Error handling PR merge', { error: error.message });
        }
    }

    async handlePRClosed(prData) {
        try {
            const jiraKey = this.extractJiraKey(prData.title, prData.head.ref);
            
            if (jiraKey && this.jira.isConfigured()) {
                // Update JIRA ticket back to "To Do" if PR was closed without merging
                if (!prData.merged) {
                    await this.jira.updateTicketStatus(
                        jiraKey,
                        'To Do',
                        `Pull request closed without merging: ${prData.html_url}`
                    );
                }
            }

        } catch (error) {
            this.logger.error('Error handling PR close', { error: error.message });
        }
    }

    extractJiraKey(title, branchName) {
        // Look for JIRA key pattern in title or branch name
        const jiraPattern = /([A-Z]+-\d+)/;
        
        let match = title.match(jiraPattern);
        if (match) return match[1];
        
        match = branchName.match(jiraPattern);
        if (match) return match[1];
        
        return null;
    }

    async syncJiraToTodoGPT(jiraKey) {
        try {
            if (!this.jira.isConfigured()) return null;

            const ticket = await this.jira.getTicket(jiraKey);
            if (!ticket) return null;

            // Convert JIRA ticket to Todo-GPT task format
            return {
                title: ticket.summary,
                description: ticket.description,
                taskType: this.mapJiraTypeToTaskType(ticket.issueType),
                priority: this.mapJiraPriorityToTaskPriority(ticket.priority),
                status: this.mapJiraStatusToTaskStatus(ticket.status),
                jiraKey: ticket.key,
                jiraUrl: ticket.url,
                assignee: ticket.assignee,
                created: ticket.created,
                updated: ticket.updated
            };

        } catch (error) {
            this.logger.error('Error syncing JIRA to Todo-GPT', { error: error.message });
            return null;
        }
    }

    mapJiraTypeToTaskType(jiraType) {
        const mapping = {
            'Story': 'feature',
            'Bug': 'bugfix',
            'Task': 'refactor'
        };
        return mapping[jiraType] || 'feature';
    }

    mapJiraPriorityToTaskPriority(jiraPriority) {
        const mapping = {
            'Lowest': 'low',
            'Low': 'low',
            'Medium': 'medium',
            'High': 'high',
            'Highest': 'urgent'
        };
        return mapping[jiraPriority] || 'medium';
    }

    mapJiraStatusToTaskStatus(jiraStatus) {
        const mapping = {
            'To Do': 'scheduled',
            'In Progress': 'in_progress',
            'In Review': 'in_progress',
            'Done': 'completed',
            'Cancelled': 'failed'
        };
        return mapping[jiraStatus] || 'scheduled';
    }

    // Webhook handlers
    async handleGitHubWebhook(payload) {
        try {
            const { action, pull_request } = payload;

            switch (action) {
                case 'closed':
                    if (pull_request.merged) {
                        await this.handlePRMerged(pull_request);
                    } else {
                        await this.handlePRClosed(pull_request);
                    }
                    break;
                    
                case 'opened':
                    this.logger.info('PR opened', { prUrl: pull_request.html_url });
                    break;
                    
                case 'review_requested':
                    this.logger.info('PR review requested', { prUrl: pull_request.html_url });
                    break;
            }

        } catch (error) {
            this.logger.error('Error handling GitHub webhook', { error: error.message });
        }
    }

    async handleJiraWebhook(payload) {
        try {
            const result = await this.jira.handleWebhook(payload);
            if (result && result.key && result.status && this.app && this.app.calendarManager) {
                const events = await this.app.calendarManager.getEvents();
                const event = events.find(e => e.jiraKey === result.key || (e.result && e.result.integrations && e.result.integrations.jiraTicket && e.result.integrations.jiraTicket.key === result.key));
                if (event) {
                    const normalizedStatus = result.status.toLowerCase();
                    let newStatus = event.status;
                    
                    if (normalizedStatus === 'done') {
                        await this.app.calendarManager.markTaskAsCompleted(event.id, {
                            success: true,
                            message: 'Synchronized status to Completed via JIRA Done transition webhook.'
                        });
                        newStatus = 'completed';
                    } else if (normalizedStatus === 'in progress') {
                        await this.app.calendarManager.markTaskAsStarted(event.id);
                        newStatus = 'in_progress';
                    } else if (normalizedStatus === 'cancelled' || normalizedStatus === 'rejected') {
                        await this.app.calendarManager.markTaskAsFailed(event.id, 'Task cancelled/rejected in JIRA.');
                        newStatus = 'failed';
                    }
                    
                    if (this.app.io) {
                        this.app.io.emit('task_update', {
                            taskId: event.id,
                            status: newStatus,
                            message: `JIRA webhook synced status: ${result.status}`,
                            timestamp: new Date()
                        });
                    }
                    
                    this.logger.info(`Synced status from JIRA ticket ${result.key} to task ${event.id}: ${result.status}`);
                }
            }
        } catch (error) {
            this.logger.error('Error handling JIRA webhook', { error: error.message });
        }
    }

    async notifyTaskStarted(task) {
        if (this.teams.isConfigured()) {
            await this.teams.notifyTaskStarted(task);
        }
    }

    // Configuration helpers
    getIntegrationStatus() {
        return {
            github: {
                configured: !!process.env.GITHUB_TOKEN,
                status: 'ready'
            },
            jira: {
                configured: this.jira.isConfigured(),
                status: this.jira.isConfigured() ? 'ready' : 'not configured'
            },
            teams: {
                configured: this.teams.isConfigured(),
                status: this.teams.isConfigured() ? 'ready' : 'not configured'
            }
        };
    }

    async testIntegrations() {
        const results = {
            github: { success: false, error: null },
            jira: { success: false, error: null },
            teams: { success: false, error: null }
        };

        // Test GitHub
        try {
            await this.github.getRepositoryInfo();
            results.github.success = true;
        } catch (error) {
            results.github.error = error.message;
        }

        // Test JIRA
        if (this.jira.isConfigured()) {
            try {
                await this.jira.getProjectInfo();
                results.jira.success = true;
            } catch (error) {
                results.jira.error = error.message;
            }
        } else {
            results.jira.error = 'Not configured';
        }

        // Test Teams
        if (this.teams.isConfigured()) {
            try {
                await this.teams.testConnection();
                results.teams.success = true;
            } catch (error) {
                results.teams.error = error.message;
            }
        } else {
            results.teams.error = 'Not configured';
        }

        return results;
    }
}

module.exports = IntegrationManager;
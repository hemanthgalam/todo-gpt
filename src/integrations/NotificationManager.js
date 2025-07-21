const TeamsIntegration = require('./TeamsIntegration');
const Logger = require('../utils/Logger');

class NotificationManager {
    constructor() {
        this.teams = new TeamsIntegration();
        this.logger = Logger;
        this.notificationQueue = [];
        this.isProcessing = false;
        
        // Configuration for notification filtering
        this.config = {
            quietHours: {
                enabled: process.env.TEAMS_QUIET_HOURS_ENABLED === 'true',
                start: process.env.TEAMS_QUIET_HOURS_START || '18:00',
                end: process.env.TEAMS_QUIET_HOURS_END || '09:00'
            },
            weekendNotifications: process.env.TEAMS_WEEKEND_NOTIFICATIONS !== 'false',
            priorityThreshold: process.env.TEAMS_NOTIFY_PRIORITY_THRESHOLD || 'low',
            mentionUsers: process.env.TEAMS_MENTION_USERS?.split(',') || [],
            mentionOnPriority: process.env.TEAMS_MENTION_ON_PRIORITY?.split(',') || ['urgent']
        };
    }

    async queueNotification(type, data) {
        const notification = {
            id: Date.now() + Math.random(),
            type,
            data,
            timestamp: new Date(),
            retries: 0,
            maxRetries: 3
        };

        // Check if notification should be sent based on filters
        if (!this.shouldSendNotification(notification)) {
            this.logger.info('Notification filtered out', { type, reason: 'filters' });
            return;
        }

        this.notificationQueue.push(notification);
        
        if (!this.isProcessing) {
            this.processQueue();
        }
    }

    shouldSendNotification(notification) {
        const now = new Date();
        
        // Check quiet hours
        if (this.config.quietHours.enabled && this.isQuietHours(now)) {
            // Allow urgent notifications during quiet hours
            if (notification.data.priority !== 'urgent') {
                return false;
            }
        }

        // Check weekend notifications
        if (!this.config.weekendNotifications && this.isWeekend(now)) {
            // Allow urgent notifications on weekends
            if (notification.data.priority !== 'urgent') {
                return false;
            }
        }

        // Check priority threshold
        const priorityLevels = { low: 1, medium: 2, high: 3, urgent: 4 };
        const threshold = priorityLevels[this.config.priorityThreshold] || 1;
        const notificationPriority = priorityLevels[notification.data.priority] || 1;
        
        if (notificationPriority < threshold) {
            return false;
        }

        return true;
    }

    isQuietHours(date) {
        const time = date.toTimeString().slice(0, 5); // HH:MM format
        const start = this.config.quietHours.start;
        const end = this.config.quietHours.end;
        
        // Handle overnight quiet hours (e.g., 18:00 to 09:00)
        if (start > end) {
            return time >= start || time <= end;
        }
        
        return time >= start && time <= end;
    }

    isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday or Saturday
    }

    async processQueue() {
        if (this.isProcessing || this.notificationQueue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.notificationQueue.length > 0) {
            const notification = this.notificationQueue.shift();
            
            try {
                await this.sendNotification(notification);
                this.logger.info('Notification sent successfully', { 
                    type: notification.type, 
                    id: notification.id 
                });
                
                // Small delay between notifications to avoid rate limiting
                await this.delay(1000);
                
            } catch (error) {
                this.logger.error('Failed to send notification', { 
                    error: error.message, 
                    notification: notification.id 
                });
                
                // Retry logic
                if (notification.retries < notification.maxRetries) {
                    notification.retries++;
                    this.notificationQueue.push(notification);
                    
                    // Exponential backoff
                    await this.delay(Math.pow(2, notification.retries) * 1000);
                }
            }
        }

        this.isProcessing = false;
    }

    async sendNotification(notification) {
        const { type, data } = notification;

        // Add user mentions for high-priority notifications
        if (this.shouldMentionUsers(data)) {
            data.mentions = this.config.mentionUsers;
        }

        switch (type) {
            case 'task_started':
                return await this.teams.notifyTaskStarted(data);
                
            case 'pr_created':
                return await this.teams.notifyPullRequestCreated(
                    data.task, 
                    data.prResult, 
                    data.jiraTicket
                );
                
            case 'task_completed':
                return await this.teams.notifyTaskCompleted(
                    data.task, 
                    data.result, 
                    data.integrations
                );
                
            case 'pr_merged':
                return await this.teams.notifyPullRequestMerged(data.prData);
                
            case 'jira_updated':
                return await this.teams.notifyJiraTicketUpdated(
                    data.ticket, 
                    data.oldStatus, 
                    data.newStatus
                );
                
            case 'error':
                return await this.teams.notifyError(data.error, data.context);
                
            case 'daily_digest':
                return await this.teams.notifyDailyDigest(data.stats);
                
            case 'review_request':
                return await this.teams.notifyReviewRequest(
                    data.prData, 
                    data.reviewers
                );
                
            default:
                throw new Error(`Unknown notification type: ${type}`);
        }
    }

    shouldMentionUsers(data) {
        if (!this.config.mentionUsers.length) {
            return false;
        }
        
        return this.config.mentionOnPriority.includes(data.priority);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Convenience methods for different notification types
    async notifyTaskStarted(task) {
        await this.queueNotification('task_started', task);
    }

    async notifyPullRequestCreated(task, prResult, jiraTicket) {
        await this.queueNotification('pr_created', { task, prResult, jiraTicket });
    }

    async notifyTaskCompleted(task, result, integrations) {
        await this.queueNotification('task_completed', { task, result, integrations });
    }

    async notifyPullRequestMerged(prData) {
        await this.queueNotification('pr_merged', { prData });
    }

    async notifyJiraTicketUpdated(ticket, oldStatus, newStatus) {
        await this.queueNotification('jira_updated', { ticket, oldStatus, newStatus });
    }

    async notifyError(error, context) {
        // Errors always bypass filters
        const errorData = { error, context, priority: 'urgent' };
        await this.queueNotification('error', errorData);
    }

    async notifyDailyDigest(stats) {
        await this.queueNotification('daily_digest', { stats });
    }

    async notifyReviewRequest(prData, reviewers) {
        await this.queueNotification('review_request', { prData, reviewers });
    }

    // Health check and statistics
    getQueueStatus() {
        return {
            queueLength: this.notificationQueue.length,
            isProcessing: this.isProcessing,
            config: this.config
        };
    }

    async testNotification() {
        const testData = {
            title: 'Test Notification',
            priority: 'medium',
            taskType: 'test'
        };
        
        await this.queueNotification('task_started', testData);
    }

    // Configuration updates
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        this.logger.info('Notification configuration updated', { config: this.config });
    }
}

module.exports = NotificationManager;
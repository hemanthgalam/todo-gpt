const axios = require('axios');

class JiraIntegration {
    constructor() {
    }

    get baseUrl() {
        const ConfigManager = require('../utils/ConfigManager');
        return ConfigManager.get('JIRA_BASE_URL');
    }

    get email() {
        const ConfigManager = require('../utils/ConfigManager');
        return ConfigManager.get('JIRA_EMAIL');
    }

    get apiToken() {
        const ConfigManager = require('../utils/ConfigManager');
        return ConfigManager.get('JIRA_API_TOKEN');
    }

    get projectKey() {
        const ConfigManager = require('../utils/ConfigManager');
        return ConfigManager.get('JIRA_PROJECT_KEY');
    }

    get client() {
        return axios.create({
            baseURL: `${this.baseUrl}/rest/api/3`,
            auth: {
                username: this.email,
                password: this.apiToken
            },
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        });
    }

    isConfigured() {
        return !!(this.baseUrl && this.email && this.apiToken);
    }

    async createTicket(taskData) {
        if (!this.isConfigured()) {
            throw new Error('JIRA integration not configured');
        }

        try {
            const issueData = {
                fields: {
                    project: {
                        key: this.projectKey
                    },
                    summary: taskData.title,
                    description: this.formatDescription(taskData),
                    issuetype: {
                        name: this.mapTaskTypeToIssueType(taskData.taskType)
                    },
                    priority: {
                        name: this.mapPriorityToJira(taskData.priority)
                    },
                    labels: ['todo-gpt', 'automated', taskData.taskType],
                    customfield_10000: taskData.projectPath // Epic Link or custom field
                }
            };

            // Add assignee if specified
            if (taskData.assignee) {
                issueData.fields.assignee = {
                    emailAddress: taskData.assignee
                };
            }

            const response = await this.client.post('/issue', issueData);
            
            const ticket = {
                key: response.data.key,
                id: response.data.id,
                url: `${this.baseUrl}/browse/${response.data.key}`,
                status: 'To Do',
                priority: taskData.priority
            };

            console.log(`Created JIRA ticket: ${ticket.key}`);
            return ticket;

        } catch (error) {
            console.error('Error creating JIRA ticket:', error.response?.data || error.message);
            throw new Error('Failed to create JIRA ticket: ' + (error.response?.data?.errorMessages?.[0] || error.message));
        }
    }

    async updateTicketStatus(ticketKey, status, comment = null) {
        if (!this.isConfigured()) return;

        try {
            // Get available transitions
            const transitionsResponse = await this.client.get(`/issue/${ticketKey}/transitions`);
            const transitions = transitionsResponse.data.transitions;
            
            // Find the transition for the desired status
            const transition = transitions.find(t => 
                t.to.name.toLowerCase() === status.toLowerCase() ||
                t.name.toLowerCase().includes(status.toLowerCase())
            );

            if (!transition) {
                console.warn(`No transition found for status: ${status}`);
                return;
            }

            // Perform transition
            const transitionData = {
                transition: {
                    id: transition.id
                }
            };

            // Add comment if provided
            if (comment) {
                transitionData.update = {
                    comment: [{
                        add: {
                            body: {
                                type: 'doc',
                                version: 1,
                                content: [{
                                    type: 'paragraph',
                                    content: [{
                                        type: 'text',
                                        text: comment
                                    }]
                                }]
                            }
                        }
                    }]
                };
            }

            await this.client.post(`/issue/${ticketKey}/transitions`, transitionData);
            console.log(`Updated JIRA ticket ${ticketKey} to status: ${status}`);

        } catch (error) {
            console.error('Error updating JIRA ticket status:', error.response?.data || error.message);
        }
    }

    async addComment(ticketKey, comment) {
        if (!this.isConfigured()) return;

        try {
            const commentData = {
                body: {
                    type: 'doc',
                    version: 1,
                    content: [{
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: comment
                        }]
                    }]
                }
            };

            await this.client.post(`/issue/${ticketKey}/comment`, commentData);
            console.log(`Added comment to JIRA ticket: ${ticketKey}`);

        } catch (error) {
            console.error('Error adding JIRA comment:', error.response?.data || error.message);
        }
    }

    async getTicket(ticketKey) {
        if (!this.isConfigured()) return null;

        try {
            const response = await this.client.get(`/issue/${ticketKey}`);
            const issue = response.data;

            return {
                key: issue.key,
                id: issue.id,
                url: `${this.baseUrl}/browse/${issue.key}`,
                summary: issue.fields.summary,
                description: issue.fields.description,
                status: issue.fields.status.name,
                priority: issue.fields.priority.name,
                assignee: issue.fields.assignee?.emailAddress,
                created: issue.fields.created,
                updated: issue.fields.updated
            };

        } catch (error) {
            console.error('Error getting JIRA ticket:', error.response?.data || error.message);
            return null;
        }
    }

    async linkPullRequest(ticketKey, prUrl, prTitle) {
        if (!this.isConfigured()) return;

        try {
            // Add web link to the ticket
            const linkData = {
                object: {
                    url: prUrl,
                    title: `PR: ${prTitle}`,
                    icon: {
                        url16x16: 'https://github.com/favicon.ico'
                    }
                }
            };

            await this.client.post(`/issue/${ticketKey}/remotelink`, linkData);
            
            // Also add a comment
            const comment = `🔗 Pull Request created: [${prTitle}](${prUrl})\n\nGenerated automatically by Todo-GPT`;
            await this.addComment(ticketKey, comment);

            console.log(`Linked PR to JIRA ticket: ${ticketKey}`);

        } catch (error) {
            console.error('Error linking PR to JIRA:', error.response?.data || error.message);
        }
    }

    async searchTickets(jql) {
        if (!this.isConfigured()) return [];

        try {
            const response = await this.client.post('/search', {
                jql: jql,
                maxResults: 50,
                fields: ['summary', 'status', 'priority', 'assignee', 'created']
            });

            return response.data.issues.map(issue => ({
                key: issue.key,
                summary: issue.fields.summary,
                status: issue.fields.status.name,
                priority: issue.fields.priority.name,
                assignee: issue.fields.assignee?.emailAddress,
                url: `${this.baseUrl}/browse/${issue.key}`
            }));

        } catch (error) {
            console.error('Error searching JIRA tickets:', error.response?.data || error.message);
            return [];
        }
    }

    async getProjectInfo() {
        if (!this.isConfigured()) return null;

        try {
            const response = await this.client.get(`/project/${this.projectKey}`);
            return {
                key: response.data.key,
                name: response.data.name,
                description: response.data.description,
                lead: response.data.lead.emailAddress
            };

        } catch (error) {
            console.error('Error getting project info:', error.response?.data || error.message);
            return null;
        }
    }

    formatDescription(taskData) {
        let description = {
            type: 'doc',
            version: 1,
            content: []
        };

        // Add main description
        if (taskData.description) {
            description.content.push({
                type: 'paragraph',
                content: [{
                    type: 'text',
                    text: taskData.description
                }]
            });
        }

        // Add requirements
        if (taskData.requirements && taskData.requirements.length > 0) {
            description.content.push({
                type: 'heading',
                attrs: { level: 3 },
                content: [{
                    type: 'text',
                    text: 'Requirements'
                }]
            });

            description.content.push({
                type: 'bulletList',
                content: taskData.requirements.map(req => ({
                    type: 'listItem',
                    content: [{
                        type: 'paragraph',
                        content: [{
                            type: 'text',
                            text: req
                        }]
                    }]
                }))
            });
        }

        // Add project info
        description.content.push({
            type: 'heading',
            attrs: { level: 3 },
            content: [{
                type: 'text',
                text: 'Project Details'
            }]
        });

        description.content.push({
            type: 'paragraph',
            content: [{
                type: 'text',
                text: `Project Path: ${taskData.projectPath}`
            }]
        });

        description.content.push({
            type: 'paragraph',
            content: [{
                type: 'text',
                text: `Scheduled: ${new Date(taskData.scheduledTime).toLocaleString()}`
            }]
        });

        description.content.push({
            type: 'paragraph',
            content: [{
                type: 'text',
                text: 'This ticket was created automatically by Todo-GPT'
            }]
        });

        return description;
    }

    mapTaskTypeToIssueType(taskType) {
        const mapping = {
            feature: 'Story',
            bugfix: 'Bug',
            refactor: 'Task',
            optimization: 'Task',
            documentation: 'Task'
        };
        return mapping[taskType] || 'Task';
    }

    mapPriorityToJira(priority) {
        const mapping = {
            low: 'Low',
            medium: 'Medium',
            high: 'High',
            urgent: 'Highest'
        };
        return mapping[priority] || 'Medium';
    }

    // Webhook handler for JIRA events
    async handleWebhook(webhookData) {
        try {
            const { issue, changelog } = webhookData;
            
            if (!issue) return null;

            // Check if this is a Todo-GPT created ticket
            const labels = issue.fields.labels || [];
            if (!labels.some(label => label === 'todo-gpt')) {
                return null;
            }

            // Handle status changes
            if (changelog && changelog.items) {
                const statusChange = changelog.items.find(item => item.field === 'status');
                if (statusChange) {
                    console.log(`JIRA ticket ${issue.key} status changed: ${statusChange.fromString} → ${statusChange.toString}`);
                    return {
                        key: issue.key,
                        status: statusChange.toString // e.g. "In Progress", "Done", "To Do"
                    };
                }
            }
            return null;
        } catch (error) {
            console.error('Error handling JIRA webhook:', error);
            return null;
        }
    }
}

module.exports = JiraIntegration;
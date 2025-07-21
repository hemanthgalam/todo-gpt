# Microsoft Teams Integration Setup Guide

This guide will help you set up Microsoft Teams integration with Todo-GPT to receive automated notifications about development tasks, pull requests, and JIRA tickets.

## 🚀 Quick Setup

### Step 1: Create Teams Incoming Webhook

1. **Open Microsoft Teams** and navigate to the channel where you want to receive notifications
2. **Click the three dots (...)** next to the channel name
3. **Select "Connectors"** from the dropdown menu
4. **Search for "Incoming Webhook"** and click "Configure"
5. **Provide a name** for your webhook (e.g., "Todo-GPT Notifications")
6. **Upload an icon** (optional) - you can use a robot or automation icon
7. **Click "Create"** to generate the webhook URL
8. **Copy the webhook URL** - you'll need this for configuration

### Step 2: Configure Environment Variables

Add the following to your `.env` file:

```env
# Microsoft Teams Integration
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-url-here
TEAMS_CHANNEL_NAME=Development
```

### Step 3: Test the Integration

1. **Restart Todo-GPT** to load the new configuration
2. **Open the web interface** at `http://localhost:3000`
3. **Click "Test Integrations"** button
4. **Check your Teams channel** for a test message

## 📋 What You'll Receive

### Task Started Notifications
```
🚀 Todo-GPT Task Started
FEATURE • Priority: HIGH

Task: Add user authentication
Type: feature
Priority: high
Project: /path/to/project
Scheduled: 1/15/2024, 2:00:00 PM

Implement JWT-based authentication system
```

### Pull Request Created
```
📝 Pull Request Ready for Review
FEATURE • HIGH Priority

Task: Add user authentication
PR Number: #42
Branch: PROJ-123/feature/user-auth
Type: feature
JIRA Ticket: PROJ-123

[View Pull Request] [View JIRA Ticket]
```

### Task Completion
```
✅ Todo-GPT Task Completed Successfully
FEATURE • HIGH Priority

Task: Add user authentication
Status: Completed Successfully
Duration: 5m 32s
Steps Completed: 4/4
JIRA Ticket: PROJ-123
Pull Request: #42

[Review Pull Request] [View JIRA Ticket]
```

### Pull Request Merged
```
🎉 Pull Request Merged
PR #42 has been successfully merged

Pull Request: Add user authentication
Author: todo-gpt-bot
Merged by: john.doe
Branch: PROJ-123/feature/user-auth
Commits: 3

[View Merged PR]
```

### Error Notifications
```
⚠️ Todo-GPT Error Alert
An error occurred during task execution

Error: Failed to create GitHub branch
Context: Task: Add user authentication
Timestamp: 1/15/2024, 2:15:30 PM
```

## 🎨 Customization Options

### Channel Configuration
You can send notifications to different channels by creating multiple webhooks:

```env
# Main development channel
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/dev-channel-webhook

# Separate channels for different notification types
TEAMS_PR_WEBHOOK_URL=https://outlook.office.com/webhook/pr-review-channel
TEAMS_ERROR_WEBHOOK_URL=https://outlook.office.com/webhook/alerts-channel
```

### Custom Message Templates
You can customize the message appearance by modifying the Teams integration:

```javascript
// Custom colors for different priorities
const priorityColors = {
    low: "28A745",      // Green
    medium: "FFC107",   // Yellow
    high: "FF8C00",     // Orange
    urgent: "DC3545"    // Red
};

// Custom emojis for task types
const taskTypeEmojis = {
    feature: "✨",
    bugfix: "🐛",
    refactor: "♻️",
    optimization: "⚡",
    documentation: "📝"
};
```

## 🔧 Advanced Features

### Daily Digest Notifications
Enable daily summary reports:

```env
TEAMS_DAILY_DIGEST=true
TEAMS_DIGEST_TIME=09:00
TEAMS_DIGEST_TIMEZONE=America/New_York
```

This will send a daily summary like:
```
📊 Todo-GPT Daily Digest
1/15/2024 • Development Activity Summary

Tasks Completed: 5
Pull Requests Created: 4
JIRA Tickets Updated: 8
Success Rate: 80%
Average Completion Time: 12m 45s
```

### Mention Specific Users
Configure user mentions for high-priority tasks:

```env
TEAMS_MENTION_USERS=john.doe@company.com,jane.smith@company.com
TEAMS_MENTION_ON_PRIORITY=high,urgent
```

### Filter Notifications
Control which notifications are sent:

```env
TEAMS_NOTIFY_TASK_START=true
TEAMS_NOTIFY_PR_CREATED=true
TEAMS_NOTIFY_TASK_COMPLETED=true
TEAMS_NOTIFY_PR_MERGED=true
TEAMS_NOTIFY_ERRORS=true
```

## 🛠 Troubleshooting

### Common Issues

#### Webhook URL Not Working
- **Check the URL format**: Should start with `https://outlook.office.com/webhook/`
- **Verify permissions**: Ensure you have permission to add connectors to the channel
- **Test manually**: Try sending a test message using curl:

```bash
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message from Todo-GPT"}'
```

#### Messages Not Appearing
- **Check channel permissions**: Ensure the webhook is configured for the correct channel
- **Verify webhook is active**: Go to Teams > Channel > Connectors and check status
- **Check logs**: Look for error messages in Todo-GPT logs

#### Formatting Issues
- **Message too long**: Teams has a 28KB limit for messages
- **Invalid JSON**: Check for special characters in task descriptions
- **Missing fields**: Ensure all required fields are present in the message

### Debug Mode
Enable debug logging for Teams integration:

```env
LOG_LEVEL=debug
TEAMS_DEBUG=true
```

This will log all outgoing messages and responses.

## 🔒 Security Considerations

### Webhook Security
- **Keep webhook URLs private**: Don't commit them to version control
- **Rotate webhooks regularly**: Create new webhooks periodically
- **Monitor usage**: Check Teams connector logs for unusual activity

### Information Disclosure
- **Review message content**: Ensure no sensitive information is included
- **Filter sensitive projects**: Exclude certain projects from notifications
- **Use environment-specific webhooks**: Different URLs for dev/staging/prod

## 📱 Mobile Notifications

Teams mobile app will automatically notify team members when messages are posted to channels they're subscribed to. Users can:

- **Customize notification settings** per channel
- **Set quiet hours** to avoid after-hours notifications
- **Use @mentions** for urgent items requiring immediate attention

## 🎯 Best Practices

### Channel Organization
- **Dedicated channels**: Create specific channels for different types of notifications
- **Team-specific channels**: Separate notifications by team or project
- **Archive old channels**: Keep notification history organized

### Message Frequency
- **Batch notifications**: Group related updates to reduce noise
- **Priority-based filtering**: Only send urgent notifications to main channels
- **Time-based filtering**: Avoid notifications outside business hours

### Team Adoption
- **Training sessions**: Show team members how to interpret notifications
- **Feedback collection**: Regularly ask for input on notification usefulness
- **Gradual rollout**: Start with a small team before company-wide deployment

## 🚀 Integration with Other Tools

### Power Automate
Connect Teams notifications to Power Automate for additional workflows:
- Create tasks in Planner when PRs are created
- Send email summaries to stakeholders
- Update SharePoint lists with task status

### Azure DevOps
If using Azure DevOps instead of GitHub:
- Configure Azure DevOps webhooks
- Link work items to Teams notifications
- Show build and deployment status

## 📊 Analytics and Reporting

Track notification effectiveness:
- **Click-through rates** on action buttons
- **Response times** to review requests
- **Team engagement** with automated notifications

## 🔄 Maintenance

### Regular Tasks
- **Monitor webhook health** monthly
- **Update message templates** based on team feedback
- **Review notification frequency** and adjust as needed
- **Clean up old webhooks** that are no longer used

### Backup and Recovery
- **Document webhook URLs** in a secure location
- **Export connector configurations** regularly
- **Test disaster recovery** procedures

---

## 🎉 You're All Set!

Once configured, your team will receive real-time notifications about:
- ✅ Task execution status
- 📝 Pull requests ready for review
- 🎯 JIRA ticket updates
- ⚠️ Error alerts and system issues
- 📊 Daily productivity summaries

This keeps everyone informed and engaged with the automated development process, making Todo-GPT a true team collaboration tool!
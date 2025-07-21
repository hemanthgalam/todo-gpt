# Todo-GPT Setup Guide

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

#### Required Settings

```env
# AI Configuration (Required)
OPENAI_API_KEY=sk-your-openai-api-key-here
AI_MODEL=gpt-4

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### GitHub Integration (Optional but Recommended)

```env
# GitHub Personal Access Token with repo permissions
GITHUB_TOKEN=ghp_your-github-token-here

# Default reviewers for PRs (comma-separated usernames)
DEFAULT_REVIEWERS=john-doe,jane-smith
```

#### JIRA Integration (Optional but Recommended)

```env
# Your JIRA instance URL
JIRA_BASE_URL=https://your-company.atlassian.net

# Your JIRA email address
JIRA_EMAIL=your-email@company.com

# JIRA API token (generate from Account Settings > Security > API tokens)
JIRA_API_TOKEN=your-jira-api-token

# Your JIRA project key
JIRA_PROJECT_KEY=PROJ
```

#### Microsoft Teams Integration (Optional but Recommended)

```env
# Teams incoming webhook URL
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/your-webhook-url

# Channel name for notifications (optional)
TEAMS_CHANNEL_NAME=Development

# Daily digest settings (optional)
TEAMS_DAILY_DIGEST=true
TEAMS_DIGEST_TIME=0 9 * * *
```

### 3. Start the Application

```bash
npm start
```

Visit `http://localhost:3000` to access the web interface.

## 🔧 Integration Setup

### GitHub Integration Setup

1. **Generate Personal Access Token**:

   - Go to GitHub Settings > Developer settings > Personal access tokens
   - Click "Generate new token (classic)"
   - Select scopes: `repo`, `workflow`, `write:packages`
   - Copy the token to your `.env` file

2. **Repository Requirements**:

   - Your project must be a Git repository
   - Must have a GitHub remote origin
   - You must have push permissions to the repository

3. **What it does**:
   - Creates feature branches automatically
   - Commits all changes with descriptive messages
   - Creates pull requests with detailed descriptions
   - Adds appropriate labels and reviewers
   - Links to JIRA tickets if configured

### JIRA Integration Setup

1. **Generate API Token**:

   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy the token to your `.env` file

2. **Project Configuration**:

   - Ensure you have permission to create issues in the project
   - The project key should match your JIRA project

3. **What it does**:
   - Creates JIRA tickets automatically for each task
   - Updates ticket status as tasks progress
   - Links pull requests to tickets
   - Adds comments with execution details

### Microsoft Teams Integration Setup

1. **Create Incoming Webhook**:

   - Open Microsoft Teams and navigate to your development channel
   - Click the three dots (...) next to the channel name
   - Select "Connectors" from the dropdown menu
   - Search for "Incoming Webhook" and click "Configure"
   - Provide a name (e.g., "Todo-GPT Notifications")
   - Click "Create" and copy the webhook URL

2. **Configure Environment**:

   - Add the webhook URL to your `.env` file
   - Optionally configure daily digest settings

3. **What it does**:
   - Sends real-time notifications when tasks start
   - Notifies team when pull requests are ready for review
   - Reports task completion status with links to PRs and JIRA tickets
   - Sends daily digest summaries of development activity
   - Alerts team about errors and system issues

### Webhook Configuration (Optional)

For real-time synchronization, set up webhooks:

#### GitHub Webhooks

1. Go to your repository Settings > Webhooks
2. Add webhook with URL: `https://your-domain.com/webhooks/github`
3. Select events: Pull requests, Push
4. Content type: `application/json`

#### JIRA Webhooks

1. Go to JIRA Settings > System > Webhooks
2. Create webhook with URL: `https://your-domain.com/webhooks/jira`
3. Select events: Issue created, Issue updated, Issue transitioned

## 🎯 Usage Examples

### Basic Task Scheduling

1. Open the web interface at `http://localhost:3000`
2. Fill out the "Schedule New Task" form:
   - **Title**: "Add user authentication"
   - **Type**: "New Feature"
   - **Priority**: "High"
   - **Project Path**: "/path/to/your/project"
   - **Description**: "Implement JWT-based authentication"
   - **Requirements**:
     ```
     - Use JWT tokens
     - Include login/logout endpoints
     - Add middleware for protected routes
     - Include unit tests
     ```
3. Click "Schedule Task"

### What Happens Automatically

1. **Task Execution**: AI analyzes your project and generates implementation plan
2. **JIRA Ticket**: Creates ticket with all details and requirements
3. **Code Generation**: AI writes the actual code based on your project structure
4. **GitHub PR**: Creates branch, commits changes, and opens pull request
5. **Integration**: Links PR to JIRA ticket and updates status

### CLI Usage

For testing and manual execution:

```bash
node cli.js
```

Available commands:

- `schedule` - Schedule a new task
- `list` - List all tasks
- `analyze` - Analyze a project
- `execute` - Execute a task manually

## 🔍 Testing Integrations

### Test GitHub Connection

```bash
# Using the web interface
1. Open http://localhost:3000
2. Click "Test Integrations" button
3. Check GitHub status

# Using CLI
node -e "
const GitHubIntegration = require('./src/integrations/GitHubIntegration');
const github = new GitHubIntegration();
github.getRepositoryInfo().then(console.log).catch(console.error);
"
```

### Test JIRA Connection

```bash
# Using the web interface
1. Open http://localhost:3000
2. Click "Test Integrations" button
3. Check JIRA status

# Using CLI
node -e "
const JiraIntegration = require('./src/integrations/JiraIntegration');
const jira = new JiraIntegration();
jira.getProjectInfo().then(console.log).catch(console.error);
"
```

## 🛠 Troubleshooting

### Common Issues

#### GitHub Integration Issues

- **"Not a GitHub repository"**: Ensure your project has a GitHub remote origin
- **"Permission denied"**: Check your GitHub token has `repo` permissions
- **"Branch already exists"**: Previous execution may have failed, manually delete the branch

#### JIRA Integration Issues

- **"Authentication failed"**: Verify your email and API token are correct
- **"Project not found"**: Check your project key matches exactly
- **"Permission denied"**: Ensure you can create issues in the project

#### AI Agent Issues

- **"OpenAI API error"**: Check your API key and billing status
- **"Model not available"**: Try using `gpt-3.5-turbo` instead of `gpt-4`
- **"Rate limit exceeded"**: Wait a few minutes and try again

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

### Manual Cleanup

If something goes wrong, you can manually clean up:

```bash
# Delete failed branches
git branch -D todo-gpt/feature/failed-task-id

# Reset to main branch
git checkout main
git reset --hard origin/main
```

## 📊 Monitoring and Analytics

### Task Success Metrics

- View success rates in the web dashboard
- Monitor integration status in real-time
- Track task completion times

### Logs

- Application logs are output to console
- Integration events are logged with timestamps
- Error details are captured for debugging

## 🔒 Security Considerations

### API Keys

- Never commit `.env` files to version control
- Use environment variables in production
- Rotate tokens regularly

### Permissions

- Use minimal required permissions for tokens
- Review GitHub token scopes periodically
- Monitor JIRA API usage

### Network Security

- Use HTTPS for webhook endpoints
- Validate webhook signatures
- Implement rate limiting

## 🚀 Production Deployment

### Environment Variables

Set these in your production environment:

```bash
NODE_ENV=production
PORT=3000
OPENAI_API_KEY=your-production-key
GITHUB_TOKEN=your-production-token
JIRA_BASE_URL=your-jira-url
JIRA_EMAIL=your-email
JIRA_API_TOKEN=your-production-token
JIRA_PROJECT_KEY=your-project
```

### Process Management

Use PM2 or similar for process management:

```bash
npm install -g pm2
pm2 start src/index.js --name todo-gpt
pm2 startup
pm2 save
```

### Reverse Proxy

Configure nginx or similar:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📞 Support

For issues and questions:

1. Check this setup guide
2. Review the troubleshooting section
3. Check application logs
4. Test integrations individually
5. Create an issue in the repository

## 🎉 Success!

Once everything is configured, you should see:

- ✅ GitHub: Connected
- ✅ JIRA: Connected
- ✅ AI Agent: Online

You're ready to let Todo-GPT handle your development tasks automatically!

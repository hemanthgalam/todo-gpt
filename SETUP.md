# Setup Guide

Follow these steps to get Todo-GPT running.

## Installation

```bash
npm install
cp .env.example .env
```

## Environment Variables

Edit `.env` with your credentials:

### AI Core
- `OPENAI_API_KEY`: Your OpenAI key.
- `AI_MODEL`: `gpt-4` (recommended) or `gpt-3.5-turbo`.

### GitHub
- `GITHUB_TOKEN`: Classic Personal Access Token with `repo` scopes.
- `DEFAULT_REVIEWERS`: Comma-separated GitHub usernames.

### JIRA
- `JIRA_BASE_URL`: e.g., `https://your-org.atlassian.net`.
- `JIRA_EMAIL`: Your Atlassian email.
- `JIRA_API_TOKEN`: API token from Atlassian security settings.
- `JIRA_PROJECT_KEY`: e.g., `PROJ`.

### MS Teams
- `TEAMS_WEBHOOK_URL`: Incoming Webhook URL from your channel.

---

## Integration Details

### GitHub
The agent needs push permissions. It will:
1. Create a branch (`todo-gpt/feature/...`).
2. Commit changes.
3. Open a Pull Request.

### JIRA
The agent will:
1. Create a ticket for every scheduled task.
2. Update status (To Do -> In Progress -> Done).
3. Link the GitHub PR to the ticket.

### Teams
Notifications are sent for:
- Task start/completion.
- PRs ready for review.
- System errors.

---

## Testing Connections

Once configured, test your setup:

**Via Web:**
Open `http://localhost:3000` and click **Test Integrations**.

**Via CLI:**
```bash
# Test GitHub
node -e "const GH = require('./src/integrations/GitHubIntegration'); new GH().getRepositoryInfo().then(console.log)"

# Test JIRA
node -e "const Jira = require('./src/integrations/JiraIntegration'); new Jira().getProjectInfo().then(console.log)"
```

## Troubleshooting

- **GitHub Errors**: Verify token permissions and that your local repo has a remote named `origin`.
- **JIRA Errors**: Check that the API token is valid and the project key exists.
- **AI Errors**: Ensure your OpenAI account has enough credits.

## Running in Production

Set `NODE_ENV=production` and use a process manager like PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name todo-gpt
```

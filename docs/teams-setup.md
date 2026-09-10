# MS Teams Integration

Get real-time notifications about tasks, PRs, and JIRA updates in Microsoft Teams.

## Quick Setup

### 1. Create a Webhook in Teams
1. Open your Teams channel.
2. Go to **Connectors** -> **Incoming Webhook**.
3. Name it (e.g., "Todo-GPT") and click **Create**.
4. Copy the URL.

### 2. Update .env
Add the URL to your `.env` file:
```env
TEAMS_WEBHOOK_URL=https://outlook.office.com/webhook/...
TEAMS_CHANNEL_NAME=Development
```

### 3. Test
Restart the app and click **Test Integrations** in the web dashboard.

---

## Notifications

You will receive alerts for:
- **Task Started**: Notification when the agent begins work.
- **PR Created**: Link to the new Pull Request and JIRA ticket.
- **Task Completed**: Summary of steps and duration.
- **Errors**: Immediate alerts if a task fails.

## Advanced Configuration

### Daily Digest
Enable a morning summary of activity:
```env
TEAMS_DAILY_DIGEST=true
TEAMS_DIGEST_TIME=09:00
```

### Filtering
Control what gets sent:
```env
TEAMS_NOTIFY_TASK_START=true
TEAMS_NOTIFY_PR_CREATED=true
TEAMS_NOTIFY_ERRORS=true
```

## Troubleshooting

- **No messages?**: Verify the URL starts with `https://outlook.office.com/webhook/`.
- **Manual Test**: Run this command to test the webhook:
  ```bash
  curl -X POST "YOUR_WEBHOOK_URL" -H "Content-Type: application/json" -d '{"text": "Hello from Todo-GPT"}'
  ```
- **Logs**: Set `LOG_LEVEL=debug` to see outgoing message payloads.
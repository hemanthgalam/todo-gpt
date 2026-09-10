# Docker Deployment

Run Todo-GPT in a containerized environment using Docker.

## Quick Start

1. **Make deploy script executable**:
   ```bash
   chmod +x deploy.sh
   ```
2. **Build and start**:
   ```bash
   ./deploy.sh build
   ./deploy.sh start
   ```
The web interface will be available at `http://localhost:3000`.

## Configuration

Copy `.env.docker` to `.env` and fill in your keys:
```bash
cp .env.docker .env
```

Required keys:
- `OPENAI_API_KEY`
- `GITHUB_TOKEN`
- `JIRA_BASE_URL`, `JIRA_EMAIL`, `JIRA_API_TOKEN`
- `TEAMS_WEBHOOK_URL`

## Management

Use `deploy.sh` to manage the container:
- `logs`: View container logs.
- `status`: Check if it's running.
- `restart`: Restart the service.
- `stop`: Stop the container.

## Persistence

Data is stored in these local directories:
- `./data`: Calendar and application data.
- `./backups`: Execution backups.

## Updates

To update to the latest version:
1. `git pull`
2. `./deploy.sh build`
3. `./deploy.sh restart`

## Troubleshooting

- **Check logs**: `./deploy.sh logs`.
- **Ports**: Ensure port 3000 isn't already in use.
- **Keys**: Verify `.env` has correct credentials and the container has internet access.
# Todo-GPT Docker Deployment Guide

This guide explains how to deploy Todo-GPT using Docker containers.

## 🐳 Prerequisites

- Docker installed on your system
- Docker Compose installed on your system
- Git repository cloned locally

## 🚀 Quick Start

The easiest way to deploy Todo-GPT is using the provided deployment script:

```bash
# Make the script executable
chmod +x deploy.sh

# Build the Docker image
./deploy.sh build

# Start the container
./deploy.sh start
```

This will:
1. Build the Docker image with all dependencies
2. Create necessary data directories
3. Start the container in detached mode
4. Make the web interface available at http://localhost:3000

## ⚙️ Configuration

Before starting the container, you need to configure your environment variables:

1. Copy the example environment file:
   ```bash
   cp .env.docker .env
   ```

2. Edit the `.env` file with your actual credentials:
   ```bash
   # AI Configuration
   OPENAI_API_KEY=your_actual_openai_key
   
   # GitHub Integration
   GITHUB_TOKEN=your_actual_github_token
   
   # JIRA Integration
   JIRA_BASE_URL=your_actual_jira_url
   JIRA_EMAIL=your_actual_email
   JIRA_API_TOKEN=your_actual_jira_token
   
   # Teams Integration
   TEAMS_WEBHOOK_URL=your_actual_teams_webhook
   ```

## 🛠️ Management Commands

The deployment script provides several commands to manage your Todo-GPT container:

```bash
# View container logs
./deploy.sh logs

# Check container status
./deploy.sh status

# Restart the container
./deploy.sh restart

# Stop the container
./deploy.sh stop
```

## 📁 Data Persistence

The Docker setup mounts two directories for data persistence:

- `./data`: Stores calendar events and application data
- `./backups`: Stores backups created during task execution

These directories are mounted as volumes in the container, ensuring your data persists across container restarts.

## 🔄 Updating the Application

To update to a new version:

1. Pull the latest code:
   ```bash
   git pull
   ```

2. Rebuild the Docker image:
   ```bash
   ./deploy.sh build
   ```

3. Restart the container:
   ```bash
   ./deploy.sh restart
   ```

## 🔍 Troubleshooting

### Container fails to start

Check the logs for errors:
```bash
./deploy.sh logs
```

Common issues:
- Missing environment variables
- Invalid API keys
- Port 3000 already in use

### API errors

If you're seeing API errors:
1. Check that your API keys are correctly configured in the `.env` file
2. Ensure the container has internet access
3. Verify that the external services (OpenAI, GitHub, JIRA) are accessible

### Data persistence issues

If your data isn't persisting:
1. Check that the `./data` and `./backups` directories exist
2. Verify that the directories have the correct permissions
3. Ensure the volumes are correctly mounted in the container

## 🔒 Security Considerations

- The Docker container runs as a non-root user for improved security
- API keys and tokens are passed via environment variables, not baked into the image
- The application is accessible only on the specified port (3000 by default)

## 🌐 Production Deployment

For production deployment, consider the following additional steps:

1. **Use a reverse proxy** (Nginx, Traefik) to handle SSL termination
2. **Set up monitoring** for the container and application
3. **Configure log rotation** for container logs
4. **Use Docker secrets** for sensitive information instead of environment variables
5. **Set up automated backups** for the data directory

Example Nginx configuration for SSL termination:

```nginx
server {
    listen 443 ssl;
    server_name todo-gpt.yourdomain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

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

## 📊 Monitoring

For production deployments, consider adding monitoring:

1. **Container health checks** (already configured in docker-compose.yml)
2. **Application metrics** using Prometheus and Grafana
3. **Log aggregation** using ELK stack or similar

## 🎉 Success!

If everything is set up correctly, you should now have a fully containerized Todo-GPT application running. Access the web interface at http://localhost:3000 to start using it!
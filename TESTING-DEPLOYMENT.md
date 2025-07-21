# Todo-GPT Testing & Deployment Guide

This guide covers how to test the Todo-GPT application and deploy it using Docker containers.

## 🧪 Testing

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager
- Git repository cloned locally

### Running Tests

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Create test environment file**:
   Create a `.env.test` file with test credentials:
   ```
   OPENAI_API_KEY=your_test_key
   GITHUB_TOKEN=your_test_token
   TEAMS_WEBHOOK_URL=https://example.com/webhook
   ```

3. **Run the test suite**:
   ```bash
   npm test
   ```

4. **View test coverage**:
   After tests complete, open `coverage/lcov-report/index.html` in your browser to see detailed coverage reports.

### Manual Testing

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Test the web interface**:
   Open `http://localhost:3000` in your browser.

3. **Test API endpoints**:
   Use tools like Postman or curl to test the API endpoints:
   ```bash
   # Get events
   curl http://localhost:3000/api/calendar/events

   # Create event
   curl -X POST http://localhost:3000/api/calendar/events \
     -H "Content-Type: application/json" \
     -d '{"title":"Test Task","taskType":"feature","priority":"medium","projectPath":"/test/path","scheduledTime":"2024-01-15T14:00:00Z"}'

   # Test integrations
   curl -X POST http://localhost:3000/api/integrations/test
   ```

4. **Test Teams integration**:
   ```bash
   curl -X POST http://localhost:3000/api/teams/test
   ```

## 🐳 Docker Deployment

### Prerequisites
- Docker installed
- Docker Compose installed (optional, but recommended)

### Option 1: Using Docker Compose (Recommended)

1. **Configure environment**:
   Make sure your `.env` file is properly configured with all required credentials.

2. **Build and start containers**:
   ```bash
   docker-compose up -d
   ```

3. **View logs**:
   ```bash
   docker-compose logs -f
   ```

4. **Stop the application**:
   ```bash
   docker-compose down
   ```

### Option 2: Using Docker Directly

1. **Build the Docker image**:
   ```bash
   docker build -t todo-gpt .
   ```

2. **Run the container**:
   ```bash
   docker run -p 3000:3000 --env-file .env -v $(pwd)/data:/usr/src/app/data -v $(pwd)/backups:/usr/src/app/backups todo-gpt
   ```

### Using npm Scripts

We've added convenient npm scripts for Docker operations:

```bash
# Build Docker image
npm run docker:build

# Run Docker container
npm run docker:run

# Start with Docker Compose
npm run docker:compose

# View Docker Compose logs
npm run docker:logs

# Stop Docker Compose services
npm run docker:stop
```

## 🚀 Production Deployment

For production deployment, consider the following best practices:

### Security Considerations

1. **Use environment variables** for all sensitive information
2. **Never commit `.env` files** to version control
3. **Use Docker secrets** for sensitive data in production
4. **Set up proper network rules** to restrict access

### Scaling Options

1. **Container Orchestration**:
   - Deploy to Kubernetes for high availability
   - Use Docker Swarm for simpler orchestration

2. **Load Balancing**:
   - Set up Nginx or Traefik as a reverse proxy
   - Configure health checks for automatic recovery

3. **Database Persistence**:
   - Consider using a database instead of file storage
   - Options: MongoDB, PostgreSQL, or Redis

### Monitoring

1. **Container Health**:
   - Use Docker health checks (already configured)
   - Set up container monitoring with Prometheus

2. **Application Logs**:
   - Configure centralized logging with ELK stack
   - Use log rotation for long-running containers

3. **Performance Monitoring**:
   - Set up application performance monitoring
   - Track API response times and error rates

### CI/CD Pipeline

1. **Automated Testing**:
   ```yaml
   # Example GitHub Actions workflow
   name: Test and Build
   on: [push, pull_request]
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: npm ci
         - run: npm test
     build:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - run: docker build -t todo-gpt .
   ```

2. **Automated Deployment**:
   - Set up continuous deployment to your hosting environment
   - Use blue-green deployment for zero downtime updates

## 🔍 Troubleshooting

### Common Issues

1. **Container fails to start**:
   - Check logs: `docker logs todo-gpt`
   - Verify environment variables are set correctly
   - Ensure ports are not already in use

2. **API errors**:
   - Check if external services (OpenAI, GitHub, JIRA) are accessible
   - Verify API keys and tokens are valid
   - Check network connectivity from container

3. **Data persistence issues**:
   - Ensure volume mounts are configured correctly
   - Check file permissions in mounted directories
   - Verify data directory exists and is writable

### Debugging

1. **Enable debug logs**:
   Set `LOG_LEVEL=debug` in your `.env` file

2. **Interactive shell**:
   ```bash
   docker exec -it todo-gpt /bin/sh
   ```

3. **Inspect container**:
   ```bash
   docker inspect todo-gpt
   ```

## 📊 Verification Checklist

Use this checklist to verify your deployment:

- [ ] Web interface accessible at http://localhost:3000
- [ ] Calendar events can be created and retrieved
- [ ] GitHub integration test passes
- [ ] JIRA integration test passes (if configured)
- [ ] Teams integration test passes (if configured)
- [ ] Task execution works end-to-end
- [ ] Data persists between container restarts
- [ ] Logs are being generated correctly

## 🌐 Advanced Deployment Scenarios

### Multi-Environment Setup

Create different `.env` files for different environments:

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d

# Staging
docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Cloud Deployment

#### AWS Deployment

1. **Build and push to ECR**:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com
   docker tag todo-gpt:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/todo-gpt:latest
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/todo-gpt:latest
   ```

2. **Deploy to ECS/Fargate** using AWS console or CLI

#### Azure Deployment

1. **Build and push to ACR**:
   ```bash
   az acr login --name YourRegistry
   docker tag todo-gpt:latest yourregistry.azurecr.io/todo-gpt:latest
   docker push yourregistry.azurecr.io/todo-gpt:latest
   ```

2. **Deploy to AKS or App Service** using Azure console or CLI

#### Google Cloud Deployment

1. **Build and push to GCR**:
   ```bash
   gcloud auth configure-docker
   docker tag todo-gpt:latest gcr.io/your-project/todo-gpt:latest
   docker push gcr.io/your-project/todo-gpt:latest
   ```

2. **Deploy to GKE or Cloud Run** using Google Cloud console or CLI

## 🔒 Backup and Recovery

### Automated Backups

1. **Set up a cron job** to backup data directory:
   ```bash
   0 0 * * * tar -czf /backups/todo-gpt-data-$(date +\%Y\%m\%d).tar.gz /path/to/data
   ```

2. **Rotate backups** to save space:
   ```bash
   find /backups -name "todo-gpt-data-*.tar.gz" -mtime +7 -delete
   ```

### Recovery Procedure

1. **Stop the container**:
   ```bash
   docker-compose down
   ```

2. **Restore data from backup**:
   ```bash
   tar -xzf /backups/todo-gpt-data-20240101.tar.gz -C /path/to/restore
   ```

3. **Restart the container**:
   ```bash
   docker-compose up -d
   ```

## 🎉 Success!

If you've followed this guide, you should now have a fully tested and containerized Todo-GPT application ready for deployment. The application is scalable, maintainable, and follows best practices for modern containerized applications.
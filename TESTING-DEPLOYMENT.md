# Testing & Deployment

Guide for testing the application and deploying with Docker.

## Testing

### Local Tests
1. **Install dependencies**: `npm install`
2. **Setup test environment**: Create `.env.test` with your keys.
3. **Run tests**:
   ```bash
   npm test
   ```
4. **Coverage**: View reports in `coverage/lcov-report/index.html`.

### Manual Testing
- **Dev Server**: `npm run dev`
- **Web UI**: Open `http://localhost:3000`.
- **API Tests**:
  - `GET /api/calendar/events`: List events.
  - `POST /api/integrations/test`: Test GitHub/JIRA connections.
  - `POST /api/teams/test`: Test Teams webhook.

## Deployment with Docker

### Using Docker Compose (Recommended)
1. Ensure `.env` is configured.
2. Start services:
   ```bash
   docker-compose up -d
   ```
3. View logs:
   ```bash
   docker-compose logs -f
   ```

### Using Docker Directly
```bash
docker build -t todo-gpt .
docker run -p 3000:3000 --env-file .env -v $(pwd)/data:/usr/src/app/data todo-gpt
```

### npm Scripts
- `npm run docker:build`: Build image.
- `npm run docker:run`: Run container.
- `npm run docker:stop`: Stop services.

## Production Tips

- **Security**: Never commit `.env`. Use Docker secrets or environment variables in your cloud provider.
- **Persistence**: Mount a volume for `./data` to keep your task history.
- **Reverse Proxy**: Use Nginx or Traefik for SSL termination.
- **CI/CD**: Use GitHub Actions to run `npm test` on every push.

## Troubleshooting

1. **Startup Failures**: Check `docker logs todo-gpt`. Ensure port 3000 is free.
2. **API Issues**: Verify the container has internet access and keys are valid.
3. **Debug Logs**: Set `LOG_LEVEL=debug` in `.env`.
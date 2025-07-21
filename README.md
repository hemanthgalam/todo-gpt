# Todo-GPT: AI-Powered Project Assistant

An intelligent AI agent that autonomously handles project development tasks with automatic GitHub PR creation and JIRA ticket management.

## 🚀 Features

- 📅 **Smart Scheduling**: Calendar-based task scheduling with priority management
- 🤖 **AI Agent**: Autonomous code analysis, planning, and implementation
- 🔍 **Project Analysis**: Deep understanding of codebase structure and patterns
- ⚡ **Task Execution**: Automated feature development and bug fixes
- 🔗 **GitHub Integration**: Automatic PR creation with detailed descriptions
- 🎫 **JIRA Integration**: Ticket creation, status updates, and linking
- 💬 **Microsoft Teams**: Real-time notifications and team collaboration
- 🌐 **Web Interface**: Real-time monitoring and task management
- 📊 **Analytics**: Success rates, completion times, and integration status

## 🏗 Architecture

```
todo-gpt/
├── agent/          # AI agent core logic
├── calendar/       # Calendar management system
├── analyzer/       # Project analysis tools
├── executor/       # Task execution engine
├── integrations/   # GitHub & JIRA integrations
├── utils/          # Utility functions
└── public/         # Web interface
```

## ⚡ Quick Start

1. **Install dependencies**: `npm install`
2. **Configure environment**: `cp .env.example .env` (see [SETUP.md](SETUP.md))
3. **Start the system**: `npm start`
4. **Open web interface**: `http://localhost:3000`

## 🎯 How It Works

### 1. Schedule a Task

```javascript
// Via web interface or API
{
  "title": "Add user authentication",
  "taskType": "feature",
  "priority": "high",
  "scheduledTime": "2024-01-15T14:00:00Z",
  "projectPath": "/path/to/project",
  "requirements": [
    "Use JWT tokens",
    "Include login/logout endpoints",
    "Add unit tests"
  ]
}
```

### 2. Automatic Execution

- **Project Analysis**: AI analyzes codebase structure and patterns
- **Implementation Planning**: Generates detailed step-by-step plan
- **Code Generation**: Creates actual implementation code
- **Testing**: Runs tests and validates changes

### 3. Integration Workflow

- **JIRA Ticket**: Creates ticket with requirements and links
- **GitHub Branch**: Creates feature branch with descriptive name
- **Code Commit**: Commits changes with detailed messages
- **Pull Request**: Opens PR with comprehensive description
- **Status Sync**: Updates JIRA ticket status throughout process

## 🔧 Integrations

### GitHub Integration

- ✅ Automatic PR creation with detailed descriptions
- ✅ Feature branch management
- ✅ Commit message generation
- ✅ Label and reviewer assignment
- ✅ Status checks and updates

### JIRA Integration

- ✅ Ticket creation with requirements
- ✅ Status updates (To Do → In Progress → In Review → Done)
- ✅ PR linking and comments
- ✅ Priority and type mapping
- ✅ Webhook support for real-time sync

### Microsoft Teams Integration

- ✅ Real-time task start notifications
- ✅ Pull request review alerts with action buttons
- ✅ Task completion status with integration details
- ✅ Error notifications and system alerts
- ✅ Daily digest summaries with team metrics
- ✅ PR merge celebrations and status updates

## 📊 Dashboard Features

- **Real-time Task Monitoring**: Live updates on task progress
- **Integration Status**: GitHub and JIRA connection health
- **Success Metrics**: Completion rates and performance analytics
- **Calendar View**: Visual task scheduling and management

## 🛠 Configuration

### Required Environment Variables

```env
OPENAI_API_KEY=your-openai-key
GITHUB_TOKEN=your-github-token
JIRA_BASE_URL=https://company.atlassian.net
JIRA_EMAIL=your-email@company.com
JIRA_API_TOKEN=your-jira-token
JIRA_PROJECT_KEY=PROJ
```

### Optional Settings

```env
DEFAULT_REVIEWERS=user1,user2
LOG_LEVEL=info
PORT=3000
```

## 🎮 Usage Examples

### Web Interface

1. Open `http://localhost:3000`
2. Schedule tasks with requirements
3. Monitor real-time execution
4. View created PRs and JIRA tickets

### CLI Interface

```bash
node cli.js
# Interactive menu for scheduling and execution
```

### API Usage

```bash
# Schedule a task
curl -X POST http://localhost:3000/api/calendar/events \
  -H "Content-Type: application/json" \
  -d '{"title":"Fix login bug","taskType":"bugfix",...}'

# Check integration status
curl http://localhost:3000/api/integrations/status
```

## 🔍 Monitoring

- **Task Progress**: Real-time WebSocket updates
- **Integration Health**: Automatic connection testing
- **Error Handling**: Comprehensive error reporting and rollback
- **Audit Trail**: Complete history of all actions

## 📈 Benefits

- **Productivity**: Automate routine development tasks
- **Consistency**: Standardized PR descriptions and commit messages
- **Traceability**: Full integration between tasks, tickets, and code
- **Quality**: AI-generated tests and code reviews
- **Efficiency**: Reduce context switching between tools

## 🚀 Production Ready

- **Security**: Token-based authentication and secure integrations
- **Scalability**: Microservices architecture with auto-scaling
- **Reliability**: Backup/rollback system and error recovery
- **Monitoring**: Comprehensive logging and health checks

## 📚 Documentation

- [Setup Guide](SETUP.md) - Detailed configuration instructions
- [API Documentation](docs/api.md) - REST API reference
- [Integration Guide](docs/integrations.md) - GitHub and JIRA setup
- [Troubleshooting](docs/troubleshooting.md) - Common issues and solutions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details

---

**Ready to automate your development workflow?** Check out the [Setup Guide](SETUP.md) to get started!

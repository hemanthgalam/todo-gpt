# Teams Workflow Example

This walkthrough shows how Todo-GPT handles a feature request and keeps the team updated in MS Teams.

## Scenario: Adding User Authentication

### 1. Task Creation
A developer schedules a task: "Add JWT authentication".
- **Requirements**: Login/Register endpoints, bcrypt hashing, and unit tests.

### 2. Task Start Notification
Teams receives an alert:
> 🚀 **Task Started: Add JWT authentication**
> Priority: High
> Project: `/my-app`

### 3. Execution
The agent:
1. Analyzes the codebase.
2. Creates a JIRA ticket (`PROJ-123`).
3. Implements the auth middleware, routes, and tests.

### 4. Pull Request Ready
Teams receives a second alert once the code is pushed:
> 📝 **PR Ready: #127**
> Branch: `PROJ-123/feature/jwt-auth`
> [View Pull Request] [View JIRA Ticket]

### 5. Completion
The agent runs tests and finishes the task:
> ✅ **Task Completed: Add JWT authentication**
> Duration: 8m 45s
> Steps: 6/6 Successful.

### 6. Merge & Sync
Once a human reviews and merges the PR:
> 🎉 **PR Merged: #127**
> The JIRA ticket `PROJ-123` is automatically moved to **Done**.

---

## Benefits

- **No context switching**: Stay in Teams while the agent works.
- **Traceability**: Direct links between PRs, JIRA, and notifications.
- **Transparency**: The whole team knows when a feature is ready for review.
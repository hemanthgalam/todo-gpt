/**
 * @swagger
 * /api/calendar/events:
 *   get:
 *     summary: Get all calendar events
 *     tags: [Calendar]
 *     description: Retrieve all scheduled tasks and events
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 *
 *   post:
 *     summary: Create a new calendar event
 *     tags: [Calendar]
 *     description: Schedule a new task for execution
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EventInput'
 *     responses:
 *       200:
 *         description: The created event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/project/analyze:
 *   post:
 *     summary: Analyze a project
 *     tags: [Project]
 *     description: Analyze a project's structure, dependencies, and patterns
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProjectAnalysisInput'
 *     responses:
 *       200:
 *         description: Project analysis results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ProjectAnalysis'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/tasks/execute:
 *   post:
 *     summary: Execute a task
 *     tags: [Tasks]
 *     description: Manually execute a task plan
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - taskId
 *             properties:
 *               taskId:
 *                 type: string
 *                 description: ID of the task to execute
 *     responses:
 *       200:
 *         description: Task execution result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   description: Whether execution was successful
 *                 steps:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       stepId:
 *                         type: string
 *                       description:
 *                         type: string
 *                       success:
 *                         type: boolean
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/integrations/status:
 *   get:
 *     summary: Get integration status
 *     tags: [Integrations]
 *     description: Get status of all configured integrations
 *     responses:
 *       200:
 *         description: Integration status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegrationStatus'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/integrations/test:
 *   post:
 *     summary: Test integrations
 *     tags: [Integrations]
 *     description: Test all configured integrations
 *     responses:
 *       200:
 *         description: Integration test results
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/IntegrationTestResult'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /webhooks/github:
 *   post:
 *     summary: GitHub webhook endpoint
 *     tags: [Webhooks]
 *     description: Endpoint for GitHub webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookSuccess'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /webhooks/jira:
 *   post:
 *     summary: JIRA webhook endpoint
 *     tags: [Webhooks]
 *     description: Endpoint for JIRA webhook events
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WebhookSuccess'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/jira/sync/{jiraKey}:
 *   post:
 *     summary: Sync JIRA ticket to Todo-GPT
 *     tags: [Integrations]
 *     description: Create a Todo-GPT task from a JIRA ticket
 *     parameters:
 *       - in: path
 *         name: jiraKey
 *         required: true
 *         schema:
 *           type: string
 *         description: JIRA ticket key
 *     responses:
 *       200:
 *         description: Created task
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/JiraSyncResult'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/teams/test:
 *   post:
 *     summary: Test Teams integration
 *     tags: [Integrations]
 *     description: Send a test message to Microsoft Teams
 *     responses:
 *       200:
 *         description: Test result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TeamsTestResult'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 * 
 * /api/teams/digest:
 *   post:
 *     summary: Send Teams daily digest
 *     tags: [Integrations]
 *     description: Manually trigger sending of the daily digest to Teams
 *     responses:
 *       200:
 *         description: Digest result
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DailyDigestResult'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
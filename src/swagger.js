const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo-GPT API',
      version: '1.0.0',
      description: 'API documentation for Todo-GPT - AI-powered project assistant with calendar integration',
      contact: {
        name: 'Todo-GPT Team',
        url: 'https://github.com/todo-gpt/todo-gpt',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: '/',
        description: 'Local server',
      },
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          required: ['title', 'taskType', 'scheduledTime', 'projectPath'],
          properties: {
            id: {
              type: 'string',
              description: 'Unique identifier for the event',
              example: 'lqr7xz9g',
            },
            title: {
              type: 'string',
              description: 'Title of the task',
              example: 'Add user authentication',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the task',
              example: 'Implement JWT-based authentication system',
            },
            taskType: {
              type: 'string',
              enum: ['feature', 'bugfix', 'refactor', 'optimization', 'documentation'],
              description: 'Type of task',
              example: 'feature',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Priority level of the task',
              example: 'high',
            },
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
              example: '/path/to/project',
            },
            scheduledTime: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled time for task execution',
              example: '2023-12-31T14:00:00Z',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of requirements for the task',
              example: ['Add login endpoint', 'Implement JWT validation', 'Add unit tests'],
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'in_progress', 'completed', 'failed'],
              description: 'Current status of the task',
              example: 'scheduled',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
        },
        EventInput: {
          type: 'object',
          required: ['title', 'taskType', 'scheduledTime', 'projectPath'],
          properties: {
            title: {
              type: 'string',
              description: 'Title of the task',
              example: 'Add user authentication',
            },
            description: {
              type: 'string',
              description: 'Detailed description of the task',
              example: 'Implement JWT-based authentication system',
            },
            taskType: {
              type: 'string',
              enum: ['feature', 'bugfix', 'refactor', 'optimization', 'documentation'],
              description: 'Type of task',
              example: 'feature',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high', 'urgent'],
              description: 'Priority level of the task',
              default: 'medium',
              example: 'high',
            },
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
              example: '/path/to/project',
            },
            scheduledTime: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled time for task execution',
              example: '2023-12-31T14:00:00Z',
            },
            requirements: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'List of requirements for the task',
              example: ['Add login endpoint', 'Implement JWT validation', 'Add unit tests'],
            },
          },
        },
        ProjectAnalysisInput: {
          type: 'object',
          required: ['projectPath'],
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
              example: '/path/to/project',
            },
          },
        },
        ProjectAnalysis: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            techStack: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detected technology stack',
              example: ['Node.js', 'Express', 'React'],
            },
            dependencies: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Project dependencies',
              example: ['express', 'react', 'axios'],
            },
            fileStructure: {
              type: 'string',
              description: 'Project file structure',
            },
            codeAnalysis: {
              type: 'string',
              description: 'Analysis of the codebase',
            },
            patterns: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Detected code patterns',
              example: ['MVC', 'Singleton', 'Observer'],
            },
            metrics: {
              type: 'object',
              description: 'Code metrics',
            },
            analyzedAt: {
              type: 'string',
              format: 'date-time',
              description: 'Analysis timestamp',
            },
          },
        },
        IntegrationStatus: {
          type: 'object',
          properties: {
            github: {
              type: 'object',
              properties: {
                configured: {
                  type: 'boolean',
                  description: 'Whether GitHub integration is configured',
                },
                status: {
                  type: 'string',
                  description: 'Status of GitHub integration',
                  example: 'ready',
                },
              },
            },
            jira: {
              type: 'object',
              properties: {
                configured: {
                  type: 'boolean',
                  description: 'Whether JIRA integration is configured',
                },
                status: {
                  type: 'string',
                  description: 'Status of JIRA integration',
                  example: 'ready',
                },
              },
            },
            teams: {
              type: 'object',
              properties: {
                configured: {
                  type: 'boolean',
                  description: 'Whether Teams integration is configured',
                },
                status: {
                  type: 'string',
                  description: 'Status of Teams integration',
                  example: 'ready',
                },
              },
            },
          },
        },
        IntegrationTestResult: {
          type: 'object',
          properties: {
            github: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  description: 'Whether GitHub test was successful',
                },
                error: {
                  type: 'string',
                  nullable: true,
                  description: 'Error message if test failed',
                },
              },
            },
            jira: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  description: 'Whether JIRA test was successful',
                },
                error: {
                  type: 'string',
                  nullable: true,
                  description: 'Error message if test failed',
                },
              },
            },
            teams: {
              type: 'object',
              properties: {
                success: {
                  type: 'boolean',
                  description: 'Whether Teams test was successful',
                },
                error: {
                  type: 'string',
                  nullable: true,
                  description: 'Error message if test failed',
                },
              },
            },
          },
        },
        TeamsTestResult: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether Teams test was successful',
            },
          },
        },
        DailyDigestResult: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether digest was sent successfully',
            },
            stats: {
              type: 'object',
              properties: {
                tasksCompleted: {
                  type: 'integer',
                  description: 'Number of completed tasks',
                },
                tasksFailed: {
                  type: 'integer',
                  description: 'Number of failed tasks',
                },
                pullRequestsCreated: {
                  type: 'integer',
                  description: 'Number of pull requests created',
                },
                jiraTicketsUpdated: {
                  type: 'integer',
                  description: 'Number of JIRA tickets updated',
                },
                successRate: {
                  type: 'integer',
                  description: 'Success rate percentage',
                },
                averageCompletionTime: {
                  type: 'string',
                  description: 'Average task completion time',
                },
                date: {
                  type: 'string',
                  description: 'Date of the digest',
                },
              },
            },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
        WebhookSuccess: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether webhook was processed successfully',
            },
          },
        },
        JiraSyncResult: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              description: 'Event ID',
            },
            title: {
              type: 'string',
              description: 'Task title',
            },
            status: {
              type: 'string',
              description: 'Task status',
            },
            scheduledTime: {
              type: 'string',
              format: 'date-time',
              description: 'Scheduled time',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Calendar',
        description: 'Calendar event management',
      },
      {
        name: 'Project',
        description: 'Project analysis and management',
      },
      {
        name: 'Tasks',
        description: 'Task execution and management',
      },
      {
        name: 'Integrations',
        description: 'External integrations management',
      },
      {
        name: 'Webhooks',
        description: 'Webhook endpoints for external services',
      },
    ],
  },
  apis: ['./src/swagger-routes.js'], // Path to the API docs
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Function to setup our docs
const swaggerDocs = (app) => {
  // Route for swagger docs
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  
  // Make docs available in JSON format
  app.get('/api-docs.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
  
  console.log('📚 Swagger docs available at /api-docs');
};

module.exports = { swaggerDocs };
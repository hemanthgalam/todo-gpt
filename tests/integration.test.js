const request = require('supertest');
const fs = require('fs-extra');
const dotenv = require('dotenv');

// Load environment variables from .env.test file if it exists
if (fs.existsSync('.env.test')) {
  dotenv.config({ path: '.env.test' });
}

// Mock external services before requiring the application
jest.mock('@octokit/rest', () => {
  return {
    Octokit: jest.fn().mockImplementation(() => ({
      pulls: {
        create: jest.fn().mockResolvedValue({
          data: {
            number: 123,
            html_url: 'https://github.com/user/repo/pull/123'
          }
        }),
        requestReviewers: jest.fn().mockResolvedValue({}),
        get: jest.fn().mockResolvedValue({
          data: {
            head: { sha: 'abc123' }
          }
        })
      },
      issues: {
        addLabels: jest.fn().mockResolvedValue({}),
        createComment: jest.fn().mockResolvedValue({})
      },
      repos: {
        createCommitStatus: jest.fn().mockResolvedValue({})
      }
    }))
  };
});

jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} }),
  get: jest.fn().mockResolvedValue({ data: {} }),
  create: jest.fn().mockReturnValue({
    post: jest.fn().mockResolvedValue({ data: {} }),
    get: jest.fn().mockResolvedValue({ data: {} })
  })
}));

jest.mock('openai', () => {
  return {
    OpenAI: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [
              {
                message: {
                  content: '```json\n{"analysis":"Test analysis","steps":[{"id":1,"description":"Test step","action":"create","file":"test.js","code":"console.log(\'test\');"}],"dependencies":[],"estimatedTime":10}\n```'
                }
              }
            ]
          })
        }
      }
    }))
  };
});

jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    if (callback) callback(null, { stdout: 'mocked output', stderr: '' });
    return {
      stdout: { on: jest.fn() },
      stderr: { on: jest.fn() }
    };
  }),
  execSync: jest.fn().mockReturnValue('https://github.com/test/repo.git')
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-key';
process.env.GITHUB_TOKEN = 'test-token';
process.env.TEAMS_WEBHOOK_URL = 'https://example.com/webhook';

// Create mock data directory
const mockDataDir = './data-test';
jest.mock('fs-extra', () => {
  const originalFs = jest.requireActual('fs-extra');
  return {
    ...originalFs,
    ensureDir: jest.fn().mockResolvedValue(),
    pathExists: jest.fn().mockResolvedValue(true),
    writeJson: jest.fn().mockResolvedValue(),
    readJson: jest.fn().mockImplementation((path) => {
      if (path.includes('events.json')) {
        return Promise.resolve([]);
      }
      return Promise.resolve({});
    }),
    copy: jest.fn().mockResolvedValue(),
    remove: jest.fn().mockResolvedValue()
  };
});

// Now require the application
const TodoGPT = require('../src/index');

describe('Todo-GPT API Tests', () => {
  let app;
  let server;
  
  beforeAll(async () => {
    // Create app instance with mocked dependencies
    const todoGPT = new TodoGPT();
    app = todoGPT.app;
    server = todoGPT.server;
  });
  
  afterAll(async () => {
    // Close server if it's running
    if (server && server.close) {
      await new Promise(resolve => server.close(resolve));
    }
  });
  
  describe('API Endpoints', () => {
    test('GET /api/calendar/events should return events', async () => {
      const response = await request(app).get('/api/calendar/events');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
    
    test('POST /api/calendar/events should create an event', async () => {
      const eventData = {
        title: 'Test Task',
        description: 'Test Description',
        taskType: 'feature',
        priority: 'medium',
        projectPath: '/test/project',
        scheduledTime: new Date().toISOString(),
        requirements: ['Req 1', 'Req 2']
      };
      
      const response = await request(app)
        .post('/api/calendar/events')
        .send(eventData);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe(eventData.title);
    });
    
    test('GET /api/integrations/status should return integration status', async () => {
      const response = await request(app).get('/api/integrations/status');
      expect(response.status).toBe(200);
      expect(response.body.github).toBeDefined();
      expect(response.body.jira).toBeDefined();
      expect(response.body.teams).toBeDefined();
    });
  });
});
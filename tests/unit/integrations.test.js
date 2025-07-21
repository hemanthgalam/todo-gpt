const TeamsIntegration = require('../../src/integrations/TeamsIntegration');
const axios = require('axios');

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn().mockResolvedValue({ data: {} })
}));

describe('Integrations', () => {
  describe('TeamsIntegration', () => {
    let teamsIntegration;
    
    beforeEach(() => {
      // Set up environment for testing
      process.env.TEAMS_WEBHOOK_URL = 'https://example.com/webhook';
      teamsIntegration = new TeamsIntegration();
    });
    
    afterEach(() => {
      // Clean up
      jest.clearAllMocks();
      delete process.env.TEAMS_WEBHOOK_URL;
    });
    
    test('should be configured when webhook URL is set', () => {
      expect(teamsIntegration.isConfigured()).toBe(true);
    });
    
    test('should not be configured when webhook URL is missing', () => {
      delete process.env.TEAMS_WEBHOOK_URL;
      teamsIntegration = new TeamsIntegration();
      expect(teamsIntegration.isConfigured()).toBe(false);
    });
    
    test('should send message successfully', async () => {
      const message = { text: 'Test message' };
      const result = await teamsIntegration.sendMessage(message);
      
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://example.com/webhook',
        message,
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json'
          })
        })
      );
    });
    
    test('should handle send message failure', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));
      
      const message = { text: 'Test message' };
      const result = await teamsIntegration.sendMessage(message);
      
      expect(result).toBe(false);
    });
    
    test('should notify task started', async () => {
      const task = {
        title: 'Test Task',
        taskType: 'feature',
        priority: 'medium',
        projectPath: '/test/path',
        scheduledTime: new Date().toISOString()
      };
      
      const result = await teamsIntegration.notifyTaskStarted(task);
      
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    
    test('should notify pull request created', async () => {
      const task = {
        title: 'Test Task',
        taskType: 'feature',
        priority: 'medium'
      };
      
      const prResult = {
        prNumber: 123,
        prUrl: 'https://github.com/user/repo/pull/123',
        branch: 'feature/test'
      };
      
      const jiraTicket = {
        key: 'PROJ-123',
        url: 'https://jira.example.com/browse/PROJ-123'
      };
      
      const result = await teamsIntegration.notifyPullRequestCreated(task, prResult, jiraTicket);
      
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
    
    test('should format duration correctly', () => {
      // Test the formatDuration method directly
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 65000); // 1 minute and 5 seconds later
      
      const result = teamsIntegration.formatDuration(startTime, endTime);
      expect(result).toBe('1m 5s');
      
      // Test with just milliseconds
      const millisResult = teamsIntegration.formatDuration(null, null, 30000);
      expect(millisResult).toBe('30s');
    });
    
    test('should test connection', async () => {
      const result = await teamsIntegration.testConnection();
      
      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledTimes(1);
    });
  });
});
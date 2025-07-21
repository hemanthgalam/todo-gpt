const CalendarManager = require('../../src/calendar/CalendarManager');
const fs = require('fs-extra');
const path = require('path');

// Mock fs-extra
jest.mock('fs-extra', () => ({
  ensureDir: jest.fn().mockResolvedValue(),
  pathExists: jest.fn().mockResolvedValue(true),
  writeJson: jest.fn().mockResolvedValue(),
  readJson: jest.fn().mockResolvedValue([])
}));

describe('CalendarManager', () => {
  let calendarManager;
  
  beforeEach(() => {
    calendarManager = new CalendarManager();
    // Mock internal methods
    calendarManager.generateId = jest.fn().mockReturnValue('test-id');
  });
  
  afterEach(() => {
    jest.clearAllMocks();
  });
  
  test('should initialize correctly', () => {
    expect(calendarManager).toBeDefined();
    expect(calendarManager.eventsFile).toBeDefined();
    expect(fs.ensureDir).toHaveBeenCalled();
  });
  
  test('should get events', async () => {
    const mockEvents = [{ id: '1', title: 'Test Event' }];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const events = await calendarManager.getEvents();
    
    expect(events).toEqual(mockEvents);
    expect(fs.readJson).toHaveBeenCalledWith(calendarManager.eventsFile);
  });
  
  test('should handle error when getting events', async () => {
    fs.readJson.mockRejectedValueOnce(new Error('Read error'));
    
    const events = await calendarManager.getEvents();
    
    expect(events).toEqual([]);
  });
  
  test('should create event', async () => {
    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      projectPath: '/test/path',
      taskType: 'feature',
      priority: 'medium',
      scheduledTime: new Date().toISOString(),
      requirements: ['Req 1', 'Req 2']
    };
    
    const mockEvents = [];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const newEvent = await calendarManager.createEvent(eventData);
    
    expect(newEvent).toMatchObject({
      id: 'test-id',
      title: eventData.title,
      description: eventData.description,
      projectPath: eventData.projectPath,
      taskType: eventData.taskType,
      priority: eventData.priority,
      requirements: eventData.requirements,
      status: 'scheduled'
    });
    
    expect(fs.writeJson).toHaveBeenCalledWith(
      calendarManager.eventsFile,
      [newEvent],
      { spaces: 2 }
    );
  });
  
  test('should update event', async () => {
    const mockEvents = [
      { id: 'test-id', title: 'Old Title', status: 'scheduled' }
    ];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const updates = { title: 'New Title', status: 'in_progress' };
    const updatedEvent = await calendarManager.updateEvent('test-id', updates);
    
    expect(updatedEvent).toMatchObject({
      id: 'test-id',
      title: 'New Title',
      status: 'in_progress'
    });
    
    expect(fs.writeJson).toHaveBeenCalledWith(
      calendarManager.eventsFile,
      [updatedEvent],
      { spaces: 2 }
    );
  });
  
  test('should throw error when updating non-existent event', async () => {
    const mockEvents = [
      { id: 'other-id', title: 'Other Event' }
    ];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    await expect(
      calendarManager.updateEvent('test-id', { title: 'New Title' })
    ).rejects.toThrow('Event with ID test-id not found');
  });
  
  test('should get upcoming tasks', async () => {
    const now = new Date();
    const future = new Date(now.getTime() + 30000); // 30 seconds in the future
    const past = new Date(now.getTime() - 30000); // 30 seconds in the past
    
    const mockEvents = [
      { id: '1', title: 'Past Event', scheduledTime: past.toISOString(), status: 'scheduled' },
      { id: '2', title: 'Future Event', scheduledTime: future.toISOString(), status: 'scheduled' },
      { id: '3', title: 'Completed Event', scheduledTime: future.toISOString(), status: 'completed' }
    ];
    
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const upcomingTasks = await calendarManager.getUpcomingTasks();
    
    expect(upcomingTasks.length).toBe(1);
    expect(upcomingTasks[0].id).toBe('2');
    expect(upcomingTasks[0].shouldExecute).toBe(true);
  });
  
  test('should mark task as started', async () => {
    const mockEvents = [
      { id: 'test-id', title: 'Test Event', status: 'scheduled' }
    ];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const updatedEvent = await calendarManager.markTaskAsStarted('test-id');
    
    expect(updatedEvent.status).toBe('in_progress');
    expect(updatedEvent.startedAt).toBeDefined();
  });
  
  test('should mark task as completed', async () => {
    const mockEvents = [
      { id: 'test-id', title: 'Test Event', status: 'in_progress' }
    ];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const result = { success: true };
    const updatedEvent = await calendarManager.markTaskAsCompleted('test-id', result);
    
    expect(updatedEvent.status).toBe('completed');
    expect(updatedEvent.completedAt).toBeDefined();
    expect(updatedEvent.result).toEqual(result);
  });
  
  test('should mark task as failed', async () => {
    const mockEvents = [
      { id: 'test-id', title: 'Test Event', status: 'in_progress' }
    ];
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const error = 'Test error';
    const updatedEvent = await calendarManager.markTaskAsFailed('test-id', error);
    
    expect(updatedEvent.status).toBe('failed');
    expect(updatedEvent.failedAt).toBeDefined();
    expect(updatedEvent.error).toBe(error);
  });
  
  test('should get events by date range', async () => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    const mockEvents = [
      { id: '1', scheduledTime: yesterday.toISOString() },
      { id: '2', scheduledTime: tomorrow.toISOString() },
      { id: '3', scheduledTime: nextWeek.toISOString() }
    ];
    
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const events = await calendarManager.getEventsByDateRange(
      yesterday.toISOString(),
      tomorrow.toISOString()
    );
    
    expect(events.length).toBe(2);
    expect(events[0].id).toBe('1');
    expect(events[1].id).toBe('2');
  });
  
  test('should get events by project', async () => {
    const mockEvents = [
      { id: '1', projectPath: '/project/a' },
      { id: '2', projectPath: '/project/b' },
      { id: '3', projectPath: '/project/a' }
    ];
    
    fs.readJson.mockResolvedValueOnce(mockEvents);
    
    const events = await calendarManager.getEventsByProject('/project/a');
    
    expect(events.length).toBe(2);
    expect(events[0].id).toBe('1');
    expect(events[1].id).toBe('3');
  });
});
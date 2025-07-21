const fs = require('fs-extra');
const path = require('path');

class CalendarManager {
    constructor() {
        this.eventsFile = path.join(__dirname, '../../data/events.json');
        this.ensureDataDirectory();
    }

    async ensureDataDirectory() {
        await fs.ensureDir(path.dirname(this.eventsFile));
        if (!await fs.pathExists(this.eventsFile)) {
            await fs.writeJson(this.eventsFile, []);
        }
    }

    async getEvents() {
        try {
            return await fs.readJson(this.eventsFile);
        } catch (error) {
            console.error('Error reading events:', error);
            return [];
        }
    }

    async createEvent(eventData) {
        const events = await this.getEvents();
        
        const newEvent = {
            id: this.generateId(),
            title: eventData.title,
            description: eventData.description,
            projectPath: eventData.projectPath,
            taskType: eventData.taskType, // 'feature', 'bugfix', 'refactor', etc.
            priority: eventData.priority || 'medium',
            scheduledTime: new Date(eventData.scheduledTime),
            estimatedDuration: eventData.estimatedDuration || 60, // minutes
            status: 'scheduled',
            requirements: eventData.requirements || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        events.push(newEvent);
        await fs.writeJson(this.eventsFile, events, { spaces: 2 });
        
        return newEvent;
    }

    async updateEvent(eventId, updates) {
        const events = await this.getEvents();
        const eventIndex = events.findIndex(e => e.id === eventId);
        
        if (eventIndex === -1) {
            throw new Error(`Event with ID ${eventId} not found`);
        }

        events[eventIndex] = {
            ...events[eventIndex],
            ...updates,
            updatedAt: new Date()
        };

        await fs.writeJson(this.eventsFile, events, { spaces: 2 });
        return events[eventIndex];
    }

    async getUpcomingTasks() {
        const events = await this.getEvents();
        const now = new Date();
        const upcoming = [];

        for (const event of events) {
            const scheduledTime = new Date(event.scheduledTime);
            const timeDiff = scheduledTime.getTime() - now.getTime();
            
            // Task should execute if it's within 1 minute of scheduled time
            if (timeDiff <= 60000 && timeDiff >= 0 && event.status === 'scheduled') {
                upcoming.push({
                    ...event,
                    shouldExecute: true
                });
            }
        }

        return upcoming;
    }

    async markTaskAsStarted(taskId) {
        return await this.updateEvent(taskId, { 
            status: 'in_progress',
            startedAt: new Date()
        });
    }

    async markTaskAsCompleted(taskId, result) {
        return await this.updateEvent(taskId, { 
            status: 'completed',
            completedAt: new Date(),
            result: result
        });
    }

    async markTaskAsFailed(taskId, error) {
        return await this.updateEvent(taskId, { 
            status: 'failed',
            failedAt: new Date(),
            error: error
        });
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Calendar view helpers
    async getEventsByDateRange(startDate, endDate) {
        const events = await this.getEvents();
        const start = new Date(startDate);
        const end = new Date(endDate);

        return events.filter(event => {
            const eventDate = new Date(event.scheduledTime);
            return eventDate >= start && eventDate <= end;
        });
    }

    async getEventsByProject(projectPath) {
        const events = await this.getEvents();
        return events.filter(event => event.projectPath === projectPath);
    }
}

module.exports = CalendarManager;
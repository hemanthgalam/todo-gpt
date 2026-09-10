const fs = require('fs-extra');
const path = require('path');

class KanbanManager {
    constructor() {
        this.kanbanFile = path.join(__dirname, '../../data/kanban.json');
        this.getDataSync();
    }

    getDataSync() {
        if (process.env.NODE_ENV === 'test') return { columns: {} };
        try {
            fs.ensureDirSync(path.dirname(this.kanbanFile));
            if (!fs.existsSync(this.kanbanFile)) {
                const defaultData = { columns: {} };
                fs.writeJsonSync(this.kanbanFile, defaultData, { spaces: 2 });
                return defaultData;
            }
            return fs.readJsonSync(this.kanbanFile);
        } catch (error) {
            return { columns: {} };
        }
    }

    async getData() {
        return this.getDataSync();
    }

    async saveData(data) {
        if (process.env.NODE_ENV === 'test') return;
        await fs.ensureDir(path.dirname(this.kanbanFile));
        await fs.writeJson(this.kanbanFile, data, { spaces: 2 });
    }

    async getBoard(workspaceId = null, calendarManager = null) {
        const events = calendarManager ? await calendarManager.getEvents(workspaceId) : [];
        const kanbanData = await this.getData();
        const overrides = kanbanData.columns || {};

        const board = {
            backlog: [],
            in_progress: [],
            in_review: [],
            done: []
        };

        for (const event of events) {
            let col = overrides[event.id];
            if (!col) {
                if (event.status === 'scheduled') col = 'backlog';
                else if (event.status === 'in_progress') col = 'in_progress';
                else if (event.status === 'completed') col = 'done';
                else col = 'backlog';
            }
            if (!board[col]) board[col] = [];
            board[col].push({
                ...event,
                kanbanColumn: col
            });
        }

        return board;
    }

    async moveTask(taskId, targetColumn, calendarManager = null) {
        const validColumns = ['backlog', 'in_progress', 'in_review', 'done'];
        if (!validColumns.includes(targetColumn)) {
            throw new Error(`Invalid column: ${targetColumn}`);
        }

        const data = await this.getData();
        data.columns = data.columns || {};
        data.columns[taskId] = targetColumn;
        await this.saveData(data);

        // Sync back to calendar event status if needed
        if (calendarManager) {
            const events = await calendarManager.getEvents();
            const event = events.find(e => e.id === taskId);
            if (event) {
                let newStatus = event.status;
                if (targetColumn === 'backlog') newStatus = 'scheduled';
                if (targetColumn === 'in_progress') newStatus = 'in_progress';
                if (targetColumn === 'done') newStatus = 'completed';
                await calendarManager.updateEvent(taskId, { status: newStatus });
            }
        }

        return { taskId, targetColumn };
    }
}

module.exports = KanbanManager;

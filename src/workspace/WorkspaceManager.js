const fs = require('fs-extra');
const path = require('path');

class WorkspaceManager {
    constructor() {
        this.workspacesFile = path.join(__dirname, '../../data/workspaces.json');
        this.getDataSync();
    }

    getDefaultData() {
        return {
            activeWorkspaceId: 'ws-default',
            workspaces: [
                {
                    id: 'ws-default',
                    name: 'Default Workspace',
                    host: 'http://localhost:3000',
                    projectPath: './',
                    collaborators: ['hemanthkumargalam@gmail.com'],
                    createdAt: new Date(),
                    updatedAt: new Date()
                }
            ]
        };
    }

    getDataSync() {
        if (process.env.NODE_ENV === 'test') {
            return this.getDefaultData();
        }
        try {
            fs.ensureDirSync(path.dirname(this.workspacesFile));
            if (!fs.existsSync(this.workspacesFile)) {
                const defaultData = this.getDefaultData();
                fs.writeJsonSync(this.workspacesFile, defaultData, { spaces: 2 });
                return defaultData;
            }
            const data = fs.readJsonSync(this.workspacesFile);
            if (!data || !Array.isArray(data.workspaces)) {
                return this.getDefaultData();
            }
            return data;
        } catch (error) {
            console.error('Error reading workspaces:', error);
            return this.getDefaultData();
        }
    }

    async getData() {
        return this.getDataSync();
    }

    async saveData(data) {
        if (process.env.NODE_ENV === 'test') return;
        await fs.ensureDir(path.dirname(this.workspacesFile));
        await fs.writeJson(this.workspacesFile, data, { spaces: 2 });
    }

    async getWorkspaces() {
        return await this.getData();
    }

    async getActiveWorkspace() {
        const data = await this.getData();
        const active = (data.workspaces || []).find(w => w.id === data.activeWorkspaceId);
        return active || (data.workspaces && data.workspaces[0]) || null;
    }

    async createWorkspace(workspaceData) {
        const data = await this.getData();
        const newWorkspace = {
            id: 'ws-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            name: workspaceData.name || 'New Workspace',
            host: workspaceData.host || 'http://localhost:3000',
            projectPath: workspaceData.projectPath || './',
            collaborators: workspaceData.collaborators || [],
            createdAt: new Date(),
            updatedAt: new Date()
        };

        if (!Array.isArray(data.workspaces)) data.workspaces = [];
        data.workspaces.push(newWorkspace);
        data.activeWorkspaceId = newWorkspace.id;
        await this.saveData(data);
        return newWorkspace;
    }

    async updateWorkspace(id, updates) {
        const data = await this.getData();
        if (!Array.isArray(data.workspaces)) data.workspaces = [];
        const index = data.workspaces.findIndex(w => w.id === id);
        if (index === -1) {
            throw new Error(`Workspace ${id} not found`);
        }

        data.workspaces[index] = {
            ...data.workspaces[index],
            ...updates,
            updatedAt: new Date()
        };

        await this.saveData(data);
        return data.workspaces[index];
    }

    async deleteWorkspace(id) {
        const data = await this.getData();
        if (!Array.isArray(data.workspaces) || data.workspaces.length <= 1) {
            throw new Error('Cannot delete the only remaining workspace');
        }

        data.workspaces = data.workspaces.filter(w => w.id !== id);
        if (data.activeWorkspaceId === id) {
            data.activeWorkspaceId = data.workspaces[0].id;
        }

        await this.saveData(data);
        return data;
    }

    async setActiveWorkspace(id) {
        const data = await this.getData();
        if (!Array.isArray(data.workspaces)) data.workspaces = [];
        const exists = data.workspaces.some(w => w.id === id);
        if (!exists) {
            throw new Error(`Workspace ${id} not found`);
        }

        data.activeWorkspaceId = id;
        await this.saveData(data);
        return data;
    }

    async inviteCollaborator(workspaceId, email) {
        const data = await this.getData();
        if (!Array.isArray(data.workspaces)) data.workspaces = [];
        const workspace = data.workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (!Array.isArray(workspace.collaborators)) workspace.collaborators = [];
        if (!workspace.collaborators.includes(normalizedEmail)) {
            workspace.collaborators.push(normalizedEmail);
            workspace.updatedAt = new Date();
            await this.saveData(data);
        }

        return workspace;
    }

    async removeCollaborator(workspaceId, email) {
        const data = await this.getData();
        if (!Array.isArray(data.workspaces)) data.workspaces = [];
        const workspace = data.workspaces.find(w => w.id === workspaceId);
        if (!workspace) {
            throw new Error(`Workspace ${workspaceId} not found`);
        }

        const normalizedEmail = email.trim().toLowerCase();
        if (Array.isArray(workspace.collaborators)) {
            workspace.collaborators = workspace.collaborators.filter(e => e !== normalizedEmail);
        }
        workspace.updatedAt = new Date();

        await this.saveData(data);
        return workspace;
    }
}

module.exports = WorkspaceManager;

const fs = require('fs-extra');
const path = require('path');

class RetroManager {
    constructor() {
        this.retrosFile = path.join(__dirname, '../../data/retros.json');
        this.getDataSync();
    }

    getDefaultData() {
        return {
            retros: [
                {
                    id: 'retro-default-1',
                    workspaceId: 'ws-default',
                    sprintName: 'Sprint 1 - Initial Release',
                    createdAt: new Date(),
                    aiSummary: 'Sprint 1 execution achieved a 100% completion rate. Automated JIRA ticket updates and MS Teams notifications executed cleanly. Recommendation: Continue expanding automated test suites.',
                    columns: {
                        wentWell: [
                            { id: 'card-1', text: 'GitHub PR automation worked seamlessly', author: 'hemanth', votes: 3 },
                            { id: 'card-2', text: 'JIRA webhook status updates synced instantly', author: 'dev-lead', votes: 2 }
                        ],
                        didNotGoWell: [
                            { id: 'card-3', text: 'Unit test setup required extra timeout configuration', author: 'qa-eng', votes: 1 }
                        ],
                        actionItems: [
                            { id: 'card-4', text: 'Add performance benchmarks to CI runner', author: 'hemanth', assignee: 'hemanth', convertedToTaskId: null }
                        ],
                        ideas: [
                            { id: 'card-5', text: 'Integrate Docker container status checks in health tab', author: 'devops', votes: 4 }
                        ]
                    }
                }
            ]
        };
    }

    getDataSync() {
        if (process.env.NODE_ENV === 'test') {
            return this.getDefaultData();
        }
        try {
            fs.ensureDirSync(path.dirname(this.retrosFile));
            if (!fs.existsSync(this.retrosFile)) {
                const defaultData = this.getDefaultData();
                fs.writeJsonSync(this.retrosFile, defaultData, { spaces: 2 });
                return defaultData;
            }
            const data = fs.readJsonSync(this.retrosFile);
            if (!data || !Array.isArray(data.retros)) {
                return this.getDefaultData();
            }
            return data;
        } catch (error) {
            console.error('Error reading retros data:', error);
            return this.getDefaultData();
        }
    }

    async getData() {
        return this.getDataSync();
    }

    async saveData(data) {
        if (process.env.NODE_ENV === 'test') return;
        await fs.ensureDir(path.dirname(this.retrosFile));
        await fs.writeJson(this.retrosFile, data, { spaces: 2 });
    }

    async getRetros(workspaceId = null) {
        const data = await this.getData();
        if (workspaceId) {
            return data.retros.filter(r => !r.workspaceId || r.workspaceId === workspaceId);
        }
        return data.retros;
    }

    async getRetro(id) {
        const data = await this.getData();
        return data.retros.find(r => r.id === id) || null;
    }

    async createRetro(workspaceId, sprintName) {
        const data = await this.getData();
        const newRetro = {
            id: 'retro-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            workspaceId: workspaceId || 'ws-default',
            sprintName: sprintName || 'New Sprint Retro',
            createdAt: new Date(),
            aiSummary: 'No AI retro analysis run yet. Click "AI Retro Insights" to generate sprint health analysis.',
            columns: {
                wentWell: [],
                didNotGoWell: [],
                actionItems: [],
                ideas: []
            }
        };

        data.retros.unshift(newRetro);
        await this.saveData(data);
        return newRetro;
    }

    async addCard(retroId, columnKey, text, author = 'Anonymous') {
        const data = await this.getData();
        const retro = data.retros.find(r => r.id === retroId);
        if (!retro) throw new Error(`Retro ${retroId} not found`);

        if (!retro.columns[columnKey]) {
            throw new Error(`Invalid column key ${columnKey}`);
        }

        const newCard = {
            id: 'card-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            text: text.trim(),
            author: author || 'Anonymous',
            votes: 0,
            convertedToTaskId: null,
            createdAt: new Date()
        };

        retro.columns[columnKey].push(newCard);
        await this.saveData(data);
        return retro;
    }

    async voteCard(retroId, columnKey, cardId) {
        const data = await this.getData();
        const retro = data.retros.find(r => r.id === retroId);
        if (!retro) throw new Error(`Retro ${retroId} not found`);

        const cards = retro.columns[columnKey];
        if (!cards) throw new Error(`Invalid column key ${columnKey}`);

        const card = cards.find(c => c.id === cardId);
        if (card) {
            card.votes = (card.votes || 0) + 1;
            await this.saveData(data);
        }

        return retro;
    }

    async deleteCard(retroId, columnKey, cardId) {
        const data = await this.getData();
        const retro = data.retros.find(r => r.id === retroId);
        if (!retro) throw new Error(`Retro ${retroId} not found`);

        if (retro.columns[columnKey]) {
            retro.columns[columnKey] = retro.columns[columnKey].filter(c => c.id !== cardId);
            await this.saveData(data);
        }

        return retro;
    }

    async generateAIRetroAnalysis(retroId, taskHistory, aiAgent) {
        const data = await this.getData();
        const retro = data.retros.find(r => r.id === retroId);
        if (!retro) throw new Error(`Retro ${retroId} not found`);

        const completedCount = taskHistory.filter(t => t.status === 'completed').length;
        const failedCount = taskHistory.filter(t => t.status === 'failed').length;
        const total = taskHistory.length;
        const rate = total > 0 ? Math.round((completedCount / total) * 100) : 100;

        const prompt = `Analyze the following agile sprint telemetry data and provide a concise retrospective summary with 1 key action item recommendation.
Sprint Name: ${retro.sprintName}
Total Tasks: ${total}
Completed Tasks: ${completedCount}
Failed Tasks: ${failedCount}
Success Rate: ${rate}%
Recent Task Details: ${JSON.stringify(taskHistory.slice(0, 5).map(t => ({ title: t.title, status: t.status, type: t.taskType })))}

Respond with JSON format:
{
  "aiSummary": "2-sentence sprint summary analyzing throughput, bottlenecks, and success rate.",
  "recommendedActionItem": "Single high-impact action item description"
}`;

        try {
            let aiResult = { aiSummary: `Sprint completed with ${rate}% task success rate (${completedCount}/${total} tasks finished cleanly).`, recommendedActionItem: "Optimize automated pipeline test runtime." };
            if (aiAgent && typeof aiAgent.invokeLLM === 'function') {
                const raw = await aiAgent.invokeLLM(prompt);
                const match = raw.match(/\{[\s\S]*\}/);
                if (match) {
                    aiResult = JSON.parse(match[0]);
                }
            }

            retro.aiSummary = aiResult.aiSummary || retro.aiSummary;
            if (aiResult.recommendedActionItem) {
                retro.columns.actionItems.push({
                    id: 'card-ai-' + Date.now().toString(36),
                    text: '[AI Suggestion] ' + aiResult.recommendedActionItem,
                    author: 'SprintOps AI',
                    votes: 1,
                    convertedToTaskId: null,
                    createdAt: new Date()
                });
            }

            await this.saveData(data);
            return retro;
        } catch (err) {
            console.error('Error generating AI retro analysis:', err);
            retro.aiSummary = `Sprint finished with ${rate}% task success rate.`;
            await this.saveData(data);
            return retro;
        }
    }
}

module.exports = RetroManager;

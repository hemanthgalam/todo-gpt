const fs = require('fs-extra');
const path = require('path');

class DocManager {
    constructor() {
        this.docsFile = path.join(__dirname, '../../data/docs.json');
        this.getDataSync();
    }

    getDefaultData() {
        return {
            docs: [
                {
                    id: 'doc-default-1',
                    workspaceId: 'ws-default',
                    title: 'System Architecture & Sequence Diagram',
                    type: 'mermaid',
                    diagramType: 'sequence',
                    content: `sequenceDiagram
    actor User as Product Manager / Dev
    participant Client as SprintOps Studio UI
    participant Server as Express Backend Daemon
    participant LLM as AI Engine (Gemini/GPT/Claude/Ollama)
    participant External as GitHub & JIRA & Teams

    User->>Client: Voice Command / Chat Prompt
    Client->>Server: POST /api/speech/parse-command
    Server->>LLM: NLP Parse Command Schema
    LLM-->>Server: Structured Task Payload
    Server->>External: Create JIRA Ticket (KAN) & Teams Alert
    Server->>Client: Task Scheduled & Logged to Terminal`,
                    author: 'SprintOps Architecture AI',
                    createdAt: new Date(),
                    updatedAt: new Date()
                },
                {
                    id: 'doc-default-2',
                    workspaceId: 'ws-default',
                    title: 'SprintOps Technical Specification',
                    type: 'markdown',
                    content: `# SprintOps Architecture Spec

## 1. Overview
SprintOps is an autonomous agile development agent platform that bridges voice prompts, JIRA tickets, and GitHub pull requests.

## 2. Key Architecture Pillars
- **Workspace Scoping:** All dev tasks, retros, and documentation are isolated per workspace.
- **Docker LLM Privacy:** Supports local containerized LLMs (Ollama, LocalAI, vLLM) for air-gapped security.
- **Miro Retrospectives:** Interactive agile retro boards with AI insights and action item task conversion.`,
                    author: 'SprintOps Architecture AI',
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
            fs.ensureDirSync(path.dirname(this.docsFile));
            if (!fs.existsSync(this.docsFile)) {
                const defaultData = this.getDefaultData();
                fs.writeJsonSync(this.docsFile, defaultData, { spaces: 2 });
                return defaultData;
            }
            const data = fs.readJsonSync(this.docsFile);
            if (!data || !Array.isArray(data.docs)) {
                return this.getDefaultData();
            }
            return data;
        } catch (error) {
            console.error('Error reading docs data:', error);
            return this.getDefaultData();
        }
    }

    async getData() {
        return this.getDataSync();
    }

    async saveData(data) {
        if (process.env.NODE_ENV === 'test') return;
        await fs.ensureDir(path.dirname(this.docsFile));
        await fs.writeJson(this.docsFile, data, { spaces: 2 });
    }

    async getDocs(workspaceId = null) {
        const data = await this.getData();
        if (workspaceId) {
            return data.docs.filter(d => !d.workspaceId || d.workspaceId === workspaceId);
        }
        return data.docs;
    }

    async getDoc(id) {
        const data = await this.getData();
        return data.docs.find(d => d.id === id) || null;
    }

    async createDoc(docData) {
        const data = await this.getData();
        const newDoc = {
            id: 'doc-' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
            workspaceId: docData.workspaceId || 'ws-default',
            title: docData.title || 'Untitled Document',
            type: docData.type || 'markdown', // 'markdown' or 'mermaid'
            diagramType: docData.diagramType || 'sequence', // 'sequence', 'flowchart', 'class', 'er'
            content: docData.content || '',
            author: docData.author || 'Collaborator',
            createdAt: new Date(),
            updatedAt: new Date()
        };

        data.docs.unshift(newDoc);
        await this.saveData(data);
        return newDoc;
    }

    async updateDoc(id, updates) {
        const data = await this.getData();
        const index = data.docs.findIndex(d => d.id === id);
        if (index === -1) throw new Error(`Document ${id} not found`);

        data.docs[index] = {
            ...data.docs[index],
            ...updates,
            updatedAt: new Date()
        };

        await this.saveData(data);
        return data.docs[index];
    }

    async deleteDoc(id) {
        const data = await this.getData();
        data.docs = data.docs.filter(d => d.id !== id);
        await this.saveData(data);
        return data;
    }

    async generateAIMermaidDiagram(workspaceId, promptText, diagramType = 'sequence', aiAgent = null) {
        const systemPrompt = `You are a software architecture expert AI. Generate valid Mermaid.js diagram code based on the user prompt.
Diagram type: ${diagramType} (sequence, flowchart, class, or er).

Rules:
- Output ONLY the raw Mermaid diagram syntax.
- Do NOT include markdown \`\`\`mermaid code block markers.
- Ensure valid syntax so it renders without syntax errors.`;

        let mermaidCode = `sequenceDiagram\n    actor Client\n    participant API\n    Client->>API: Request\n    API-->>Client: Response`;
        
        if (aiAgent && typeof aiAgent.invokeLLM === 'function') {
            try {
                const raw = await aiAgent.invokeLLM(systemPrompt, promptText, 'gemini-1.5-flash', 0.2, 1500);
                mermaidCode = raw.replace(/```mermaid/g, '').replace(/```/g, '').trim();
            } catch (err) {
                console.error('Error invoking LLM for Mermaid diagram:', err);
            }
        }

        const newDoc = await this.createDoc({
            workspaceId,
            title: `AI ${diagramType.toUpperCase()} Diagram: ${promptText.substring(0, 30)}`,
            type: 'mermaid',
            diagramType,
            content: mermaidCode,
            author: 'SprintOps Architecture AI'
        });

        return newDoc;
    }
}

module.exports = DocManager;

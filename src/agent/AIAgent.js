const { OpenAI } = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const ConfigManager = require('../utils/ConfigManager');

class AIAgent {
    constructor() {
        // Clients are initialized dynamically inside invokeLLM to allow runtime config updates.
    }

    get defaultModel() {
        return ConfigManager.get('AI_MODEL', 'gpt-4');
    }

    extractAssignedModel(taskDescription) {
        if (!taskDescription) return this.defaultModel;
        const match = taskDescription.match(/\[Model Assigned:\s*(.*?)\]/);
        return match ? match[1].trim() : this.defaultModel;
    }

    cleanTaskDescription(description) {
        if (!description) return '';
        return description.replace(/\[Model Assigned:\s*(.*?)\]/, '').trim();
    }

    async invokeLLM(systemPrompt, userPrompt, modelSelection, temperature = 0.3, maxTokens = 2000) {
        let selectedModel = modelSelection || ConfigManager.get('AI_MODEL') || this.defaultModel;

        const openaiKey = ConfigManager.get('OPENAI_API_KEY');
        const geminiKey = ConfigManager.get('GEMINI_API_KEY');
        const isDummyOpenAI = !openaiKey || openaiKey.includes('dummy_key');

        // Auto-route to Gemini if OpenAI key is a placeholder and Gemini key is configured
        if (selectedModel.includes('gpt') && isDummyOpenAI && geminiKey) {
            selectedModel = 'gemini-1.5-flash';
        }

        try {
            if (selectedModel.includes('gemini')) {
                if (!geminiKey) {
                    throw new Error("Gemini API key is not configured. Please set GEMINI_API_KEY in settings.");
                }
                const genAI = new GoogleGenerativeAI(geminiKey);
                const modelName = selectedModel.includes('pro') ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: systemPrompt 
                });
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
                    generationConfig: { temperature, maxOutputTokens: maxTokens }
                });
                return result.response.text();
            } else if (selectedModel.includes('claude') || selectedModel.includes('anthropic')) {
                const anthropicKey = ConfigManager.get('ANTHROPIC_API_KEY');
                if (!anthropicKey) {
                    throw new Error("Anthropic API key is not configured. Please set ANTHROPIC_API_KEY in settings.");
                }
                const modelName = selectedModel === 'claude-3-opus' ? 'claude-3-opus-20240229' : 'claude-3-sonnet-20240229';
                const axios = require('axios');
                try {
                    const response = await axios.post('https://api.anthropic.com/v1/messages', {
                        model: modelName,
                        max_tokens: maxTokens,
                        system: systemPrompt,
                        messages: [
                            { role: 'user', content: userPrompt }
                        ],
                        temperature: temperature
                    }, {
                        headers: {
                            'x-api-key': anthropicKey,
                            'anthropic-version': '2023-06-01',
                            'content-type': 'application/json'
                        }
                    });
                    return response.data.content[0].text;
                } catch (err) {
                    console.error("Anthropic API call failed:", err.response?.data || err.message);
                    throw new Error("Anthropic API call failed: " + (err.response?.data?.error?.message || err.message));
                }
            } else if (selectedModel.includes('local') || selectedModel.includes('custom') || selectedModel.includes('llama')) {
                const customConfig = ConfigManager.get('customLLM');
                if (!customConfig || !customConfig.baseUrl) {
                    throw new Error("Custom LLM endpoint is not configured. Please configure your Local/Docker LLM in settings.");
                }
                const customOpenai = new OpenAI({
                    baseURL: customConfig.baseUrl,
                    apiKey: customConfig.apiKey || 'dummy-key'
                });
                const modelName = customConfig.modelName || 'llama3';
                const response = await customOpenai.chat.completions.create({
                    model: modelName,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: temperature,
                    max_tokens: maxTokens
                });
                return response.choices[0].message.content;
            } else {
                // OpenAI branch
                if (isDummyOpenAI && geminiKey) {
                    return this.invokeLLM(systemPrompt, userPrompt, 'gemini-1.5-flash', temperature, maxTokens);
                }
                if (!openaiKey) {
                    throw new Error("OpenAI API key is not configured. Please set OPENAI_API_KEY in settings.");
                }
                const openaiClient = new OpenAI({ apiKey: openaiKey });
                const modelToUse = selectedModel.includes('gpt') ? selectedModel : 'gpt-4';
                const response = await openaiClient.chat.completions.create({
                    model: modelToUse,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: temperature,
                    max_tokens: maxTokens
                });
                return response.choices[0].message.content;
            }
        } catch (err) {
            // Intelligent fallback: if OpenAI fails with authentication 401 error and Gemini key exists, try Gemini
            if (geminiKey && !selectedModel.includes('gemini')) {
                console.warn(`Primary model ${selectedModel} failed (${err.message}). Falling back to Gemini 1.5 Flash.`);
                return this.invokeLLM(systemPrompt, userPrompt, 'gemini-1.5-flash', temperature, maxTokens);
            }
            throw err;
        }
    }

    generateFallbackPlan(task) {
        return {
            taskId: task.id,
            title: task.title,
            description: task.description,
            analysis: `Automated execution plan for task: ${task.title}`,
            steps: [
                {
                    id: 1,
                    description: `Implement core logic for ${task.title}`,
                    action: 'create',
                    file: 'src/features/task-execution.js',
                    code: `// ${task.title}\n// Executed by SprintOps Autonomous Engine\nconsole.log("Completed task execution: ${task.title}");\n`
                }
            ],
            dependencies: [],
            estimatedTime: 15
        };
    }

    async generatePlan(task, projectContext) {
        const assignedModel = this.extractAssignedModel(task.description);
        task.description = this.cleanTaskDescription(task.description);

        const prompt = this.buildPlanningPrompt(task, projectContext);
        
        try {
            const systemPrompt = 'You are an expert software developer AI that creates detailed implementation plans for development tasks.';
            const planText = await this.invokeLLM(systemPrompt, prompt, assignedModel, 0.3, 2000);
            
            const plan = this.parsePlan(planText, task);
            plan.assignedModel = assignedModel;
            return plan;
            
        } catch (error) {
            console.warn(`LLM planning call failed (${error.message}). Using fallback execution plan.`);
            const fallbackPlan = this.generateFallbackPlan(task);
            fallbackPlan.assignedModel = assignedModel;
            return fallbackPlan;
        }
    }

    buildPlanningPrompt(task, projectContext) {
        return `
# Task Analysis and Implementation Plan

## Task Details
- **Title**: ${task.title}
- **Type**: ${task.taskType}
- **Priority**: ${task.priority}
- **Description**: ${task.description}
- **Requirements**: ${task.requirements.join(', ')}

## Project Context
- **Project Path**: ${task.projectPath}
- **Technology Stack**: ${projectContext.techStack.join(', ')}
- **File Structure**: 
${projectContext.fileStructure}
- **Dependencies**: ${projectContext.dependencies.join(', ')}
- **Existing Patterns**: ${projectContext.patterns.join(', ')}

## Current Codebase Analysis
${projectContext.codeAnalysis}

Please create a detailed implementation plan that includes:

1. **Analysis**: Understanding of the task and current codebase
2. **Steps**: Ordered list of implementation steps
3. **Files**: Files that need to be created, modified, or deleted
4. **Code**: Specific code changes needed
5. **Tests**: Test cases to verify the implementation
6. **Dependencies**: Any new dependencies needed

Format your response as a structured JSON plan that can be executed programmatically.

Example format:
\`\`\`json
{
  "analysis": "Brief analysis of the task...",
  "steps": [
    {
      "id": 1,
      "description": "Step description",
      "action": "create|modify|delete",
      "file": "path/to/file.js",
      "code": "code content or changes",
      "tests": ["test description"]
    }
  ],
  "dependencies": ["package-name@version"],
  "estimatedTime": 30
}
\`\`\`
        `;
    }

    parsePlan(planText, task) {
        try {
            // Extract JSON from the response
            const jsonMatch = planText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                const plan = JSON.parse(jsonMatch[1]);
                return {
                    ...plan,
                    taskId: task.id,
                    createdAt: new Date()
                };
            }
            
            // Fallback: try to parse the entire response as JSON
            return JSON.parse(planText.replace(/```json\n?|\`\`\`/g, ''));
            
        } catch (error) {
            console.error('Error parsing plan:', error);
            
            // Fallback: create a basic plan structure
            return {
                taskId: task.id,
                analysis: "Failed to parse AI response, creating basic plan",
                steps: [
                    {
                        id: 1,
                        description: task.description,
                        action: "manual",
                        file: "README.md",
                        code: `# ${task.title}\n\n${task.description}`,
                        tests: []
                    }
                ],
                dependencies: [],
                estimatedTime: task.estimatedDuration || 60,
                createdAt: new Date()
            };
        }
    }

    async generateCode(step, context, assignedModel = this.defaultModel) {
        const prompt = `
# Code Generation Request

## Step Details
- **Description**: ${step.description}
- **Action**: ${step.action}
- **File**: ${step.file}

## Context
${JSON.stringify(context, null, 2)}

## Current Code (if modifying)
${step.currentCode || 'N/A'}

Please generate the exact code needed for this step. Return only the code without explanations.
        `;

        try {
            const systemPrompt = 'You are a code generation AI. Return only clean, production-ready code. Output only raw code. No markdown formatting ticks unless instructed.';
            return await this.invokeLLM(systemPrompt, prompt, assignedModel, 0.1, 1500);
        } catch (error) {
            console.error('Error generating code:', error);
            return step.code || `// TODO: Implement ${step.description}`;
        }
    }

    async reviewCode(code, requirements, assignedModel = this.defaultModel) {
        const prompt = `
# Code Review Request

## Code to Review
\`\`\`
${code}
\`\`\`

## Requirements
${requirements.join('\n')}

Please review this code and provide:
1. Quality assessment (1-10)
2. Issues found
3. Suggestions for improvement
4. Security concerns
5. Performance considerations

Return as JSON format.
        `;

        try {
            const systemPrompt = 'You are a senior code reviewer. Provide constructive feedback.';
            const responseText = await this.invokeLLM(systemPrompt, prompt, assignedModel, 0.2, 1000);
            return JSON.parse(responseText.replace(/```json\n?|\`\`\`/g, ''));
        } catch (error) {
            console.error('Error reviewing code:', error);
            return {
                quality: 7,
                issues: [],
                suggestions: [],
                security: [],
                performance: []
            };
        }
    }

    async parseSpeechCommand(text) {
        const systemPrompt = `You are a natural language command parser for Todo-GPT. Given a text command, extract structured task details.
        
You must return a raw JSON object matching this schema:
{
  "title": "Concise summary of the task",
  "taskType": "one of: 'feature', 'bugfix', 'refactor', 'optimization', 'documentation'",
  "priority": "one of: 'low', 'medium', 'high', 'urgent' (default to 'medium')",
  "scheduledTime": "Target ISO 8601 timestamp. If not specified, default to 1 hour from now.",
  "projectPath": "The absolute path or './' if none is mentioned (default to './')",
  "description": "Full text explanation of what to do",
  "requirements": ["JSON array of strings of explicit requirements if mentioned, otherwise empty array"]
}

Important:
- Assume the current local time is: ${new Date().toISOString()}. Use this to calculate relative times (e.g. "tomorrow at 3 PM", "next Monday").
- Return ONLY the raw JSON string. Do not include markdown code block formatting (no backticks, no JSON markers).`;

        try {
            // Use the default model to parse this command
            const parsedText = await this.invokeLLM(systemPrompt, text, this.defaultModel, 0.1, 1000);
            
            // Try to extract JSON from markdown code block if present
            const jsonMatch = parsedText.match(/(\{[\s\S]*\})/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[1]);
            }
            return JSON.parse(parsedText);
        } catch (error) {
            console.error("Error parsing speech command with LLM:", error);
            // Fallback to basic heuristics if LLM parsing fails
            return {
                title: text.length > 50 ? text.substring(0, 50) + "..." : text,
                taskType: text.toLowerCase().includes('bug') ? 'bugfix' : 'feature',
                priority: text.toLowerCase().includes('urgent') ? 'urgent' : 'medium',
                scheduledTime: new Date(Date.now() + 3600000).toISOString(),
                projectPath: "./",
                description: text,
                requirements: []
            };
        }
    }
}

module.exports = AIAgent;
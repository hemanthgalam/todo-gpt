const { OpenAI } = require('openai');

class AIAgent {
    constructor() {
        this.openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        this.model = process.env.AI_MODEL || 'gpt-4';
    }

    async generatePlan(task, projectContext) {
        const prompt = this.buildPlanningPrompt(task, projectContext);
        
        try {
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert software developer AI that creates detailed implementation plans for development tasks.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 2000
            });

            const planText = response.choices[0].message.content;
            return this.parsePlan(planText, task);
            
        } catch (error) {
            console.error('Error generating plan:', error);
            throw new Error('Failed to generate implementation plan');
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
            return JSON.parse(planText);
            
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

    async generateCode(step, context) {
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
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a code generation AI. Return only clean, production-ready code.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.1,
                max_tokens: 1500
            });

            return response.choices[0].message.content.trim();
            
        } catch (error) {
            console.error('Error generating code:', error);
            return step.code || `// TODO: Implement ${step.description}`;
        }
    }

    async reviewCode(code, requirements) {
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
            const response = await this.openai.chat.completions.create({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are a senior code reviewer. Provide constructive feedback.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 1000
            });

            return JSON.parse(response.choices[0].message.content);
            
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
}

module.exports = AIAgent;
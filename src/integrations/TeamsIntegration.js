const axios = require("axios");
const Logger = require("../utils/Logger");

class TeamsIntegration {
  constructor() {
    this.webhookUrl = process.env.TEAMS_WEBHOOK_URL;
    this.channelName = process.env.TEAMS_CHANNEL_NAME || "Development";
    this.logger = Logger;

    if (!this.webhookUrl) {
      console.warn("Teams integration not configured. Set TEAMS_WEBHOOK_URL");
    }
  }

  isConfigured() {
    return !!this.webhookUrl;
  }

  async sendMessage(message) {
    if (!this.isConfigured()) {
      this.logger.warn("Teams integration not configured, skipping message");
      return false;
    }

    try {
      await axios.post(this.webhookUrl, message, {
        headers: {
          "Content-Type": "application/json",
        },
        timeout: 10000,
      });

      this.logger.info("Teams message sent successfully");
      return true;
    } catch (error) {
      this.logger.error("Failed to send Teams message", {
        error: error.message,
      });
      return false;
    }
  }

  async notifyTaskStarted(task) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Task Started: ${task.title}`,
      themeColor: "0078D4",
      sections: [
        {
          activityTitle: "🚀 Todo-GPT Task Started",
          activitySubtitle: `${task.taskType.toUpperCase()} • Priority: ${task.priority.toUpperCase()}`,
          activityImage:
            "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Robot/3D/robot_3d.png",
          facts: [
            {
              name: "Task",
              value: task.title,
            },
            {
              name: "Type",
              value: task.taskType,
            },
            {
              name: "Priority",
              value: task.priority,
            },
            {
              name: "Project",
              value: task.projectPath,
            },
            {
              name: "Scheduled",
              value: new Date(task.scheduledTime).toLocaleString(),
            },
          ],
          text: task.description || "No description provided",
        },
      ],
    };

    return await this.sendMessage(message);
  }

  async notifyPullRequestCreated(task, prResult, jiraTicket = null) {
    const facts = [
      {
        name: "Task",
        value: task.title,
      },
      {
        name: "PR Number",
        value: `#${prResult.prNumber}`,
      },
      {
        name: "Branch",
        value: prResult.branch,
      },
      {
        name: "Type",
        value: task.taskType,
      },
    ];

    if (jiraTicket) {
      facts.push({
        name: "JIRA Ticket",
        value: jiraTicket.key,
      });
    }

    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Pull Request Created: ${task.title}`,
      themeColor: "28A745",
      sections: [
        {
          activityTitle: "📝 Pull Request Ready for Review",
          activitySubtitle: `${task.taskType.toUpperCase()} • ${task.priority.toUpperCase()} Priority`,
          activityImage:
            "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
          facts: facts,
          text: `A new pull request has been created and is ready for review.${
            task.description ? `\n\n**Description:** ${task.description}` : ""
          }`,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Pull Request",
          targets: [
            {
              os: "default",
              uri: prResult.prUrl,
            },
          ],
        },
      ],
    };

    if (jiraTicket) {
      message.potentialAction.push({
        "@type": "OpenUri",
        name: "View JIRA Ticket",
        targets: [
          {
            os: "default",
            uri: jiraTicket.url,
          },
        ],
      });
    }

    return await this.sendMessage(message);
  }

  async notifyTaskCompleted(task, result, integrations) {
    const isSuccess = result.success;
    const themeColor = isSuccess ? "28A745" : "DC3545";
    const emoji = isSuccess ? "✅" : "❌";
    const status = isSuccess ? "Completed Successfully" : "Failed";

    const facts = [
      {
        name: "Task",
        value: task.title,
      },
      {
        name: "Status",
        value: status,
      },
      {
        name: "Duration",
        value: this.formatDuration(result.startTime, result.endTime),
      },
      {
        name: "Steps Completed",
        value: `${result.steps.filter((s) => s.success).length}/${
          result.steps.length
        }`,
      },
    ];

    if (integrations.jiraTicket) {
      facts.push({
        name: "JIRA Ticket",
        value: integrations.jiraTicket.key,
      });
    }

    if (integrations.pullRequest) {
      facts.push({
        name: "Pull Request",
        value: `#${integrations.pullRequest.prNumber}`,
      });
    }

    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Task ${status}: ${task.title}`,
      themeColor: themeColor,
      sections: [
        {
          activityTitle: `${emoji} Todo-GPT Task ${status}`,
          activitySubtitle: `${task.taskType.toUpperCase()} • ${task.priority.toUpperCase()} Priority`,
          activityImage:
            "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Robot/3D/robot_3d.png",
          facts: facts,
          text: isSuccess
            ? "The task has been completed successfully and is ready for review."
            : `Task execution failed: ${result.error}`,
        },
      ],
      potentialAction: [],
    };

    // Add action buttons based on what was created
    if (integrations.pullRequest) {
      message.potentialAction.push({
        "@type": "OpenUri",
        name: "Review Pull Request",
        targets: [
          {
            os: "default",
            uri: integrations.pullRequest.prUrl,
          },
        ],
      });
    }

    if (integrations.jiraTicket) {
      message.potentialAction.push({
        "@type": "OpenUri",
        name: "View JIRA Ticket",
        targets: [
          {
            os: "default",
            uri: integrations.jiraTicket.url,
          },
        ],
      });
    }

    return await this.sendMessage(message);
  }

  async notifyReviewRequest(prData, reviewers) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Code Review Requested: ${prData.title}`,
      themeColor: "FF8C00",
      sections: [
        {
          activityTitle: "👀 Code Review Requested",
          activitySubtitle: `PR #${prData.number} • ${reviewers.length} reviewer(s) requested`,
          activityImage:
            "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
          facts: [
            {
              name: "Pull Request",
              value: prData.title,
            },
            {
              name: "Author",
              value: prData.user.login,
            },
            {
              name: "Reviewers",
              value: reviewers.join(", "),
            },
            {
              name: "Files Changed",
              value: prData.changed_files.toString(),
            },
            {
              name: "Additions",
              value: `+${prData.additions}`,
            },
            {
              name: "Deletions",
              value: `-${prData.deletions}`,
            },
          ],
          text: `Please review the changes in this pull request.`,
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "Review Pull Request",
          targets: [
            {
              os: "default",
              uri: prData.html_url,
            },
          ],
        },
      ],
    };

    return await this.sendMessage(message);
  }

  async notifyPullRequestMerged(prData) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `Pull Request Merged: ${prData.title}`,
      themeColor: "6F42C1",
      sections: [
        {
          activityTitle: "🎉 Pull Request Merged",
          activitySubtitle: `PR #${prData.number} has been successfully merged`,
          activityImage:
            "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png",
          facts: [
            {
              name: "Pull Request",
              value: prData.title,
            },
            {
              name: "Author",
              value: prData.user.login,
            },
            {
              name: "Merged by",
              value: prData.merged_by?.login || "Unknown",
            },
            {
              name: "Branch",
              value: prData.head.ref,
            },
            {
              name: "Commits",
              value: prData.commits.toString(),
            },
          ],
          text: "The changes have been successfully merged into the main branch.",
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View Merged PR",
          targets: [
            {
              os: "default",
              uri: prData.html_url,
            },
          ],
        },
      ],
    };

    return await this.sendMessage(message);
  }

  async notifyJiraTicketUpdated(ticket, oldStatus, newStatus) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: `JIRA Ticket Updated: ${ticket.key}`,
      themeColor: "0052CC",
      sections: [
        {
          activityTitle: "📋 JIRA Ticket Status Updated",
          activitySubtitle: `${ticket.key} • ${oldStatus} → ${newStatus}`,
          activityImage:
            "https://wac-cdn.atlassian.com/dam/jcr:e348b562-4152-4cdc-8a55-3d297e509cc8/Jira%20Software-blue.svg",
          facts: [
            {
              name: "Ticket",
              value: ticket.key,
            },
            {
              name: "Summary",
              value: ticket.summary,
            },
            {
              name: "Previous Status",
              value: oldStatus,
            },
            {
              name: "New Status",
              value: newStatus,
            },
            {
              name: "Priority",
              value: ticket.priority,
            },
          ],
          text: "The ticket status has been updated by Todo-GPT automation.",
        },
      ],
      potentialAction: [
        {
          "@type": "OpenUri",
          name: "View JIRA Ticket",
          targets: [
            {
              os: "default",
              uri: ticket.url,
            },
          ],
        },
      ],
    };

    return await this.sendMessage(message);
  }

  async notifyDailyDigest(stats) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: "Todo-GPT Daily Digest",
      themeColor: "0078D4",
      sections: [
        {
          activityTitle: "📊 Todo-GPT Daily Digest",
          activitySubtitle: `${new Date().toLocaleDateString()} • Development Activity Summary`,
          activityImage:
            "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Chart%20increasing/3D/chart_increasing_3d.png",
          facts: [
            {
              name: "Tasks Completed",
              value: stats.tasksCompleted.toString(),
            },
            {
              name: "Pull Requests Created",
              value: stats.pullRequestsCreated.toString(),
            },
            {
              name: "JIRA Tickets Updated",
              value: stats.jiraTicketsUpdated.toString(),
            },
            {
              name: "Success Rate",
              value: `${stats.successRate}%`,
            },
            {
              name: "Average Completion Time",
              value: stats.averageCompletionTime,
            },
          ],
          text: "Here's your daily summary of Todo-GPT automation activities.",
        },
      ],
    };

    return await this.sendMessage(message);
  }

  async notifyError(error, context) {
    const message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: "Todo-GPT Error Alert",
      themeColor: "DC3545",
      sections: [
        {
          activityTitle: "⚠️ Todo-GPT Error Alert",
          activitySubtitle: "An error occurred during task execution",
          activityImage:
            "https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/Warning/3D/warning_3d.png",
          facts: [
            {
              name: "Error",
              value: error.message,
            },
            {
              name: "Context",
              value: context,
            },
            {
              name: "Timestamp",
              value: new Date().toLocaleString(),
            },
          ],
          text: "Please check the system logs for more details.",
        },
      ],
    };

    return await this.sendMessage(message);
  }

  // Utility methods
  formatDuration(startTime, endTime, milliseconds) {
    // If milliseconds is provided directly, use that
    if (milliseconds !== undefined) {
      const minutes = Math.floor(milliseconds / 60000);
      const seconds = Math.floor((milliseconds % 60000) / 1000);

      if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
      }
      return `${seconds}s`;
    }

    // Otherwise calculate from start and end times
    if (!startTime || !endTime) return "Unknown";

    const duration = new Date(endTime) - new Date(startTime);
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  }

  // Test connection
  async testConnection() {
    const testMessage = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      summary: "Todo-GPT Teams Integration Test",
      themeColor: "0078D4",
      sections: [
        {
          activityTitle: "🧪 Teams Integration Test",
          activitySubtitle: "Testing connection to Microsoft Teams",
          text: "If you can see this message, the Teams integration is working correctly!",
        },
      ],
    };

    return await this.sendMessage(testMessage);
  }

  // Configuration helpers
  getConfiguration() {
    return {
      configured: this.isConfigured(),
      webhookUrl: this.webhookUrl ? "***configured***" : "not set",
      channelName: this.channelName,
    };
  }
}

module.exports = TeamsIntegration;

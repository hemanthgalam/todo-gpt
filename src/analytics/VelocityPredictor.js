class VelocityPredictor {
    calculateVelocity(events = []) {
        const priorityPoints = { urgent: 8, high: 5, medium: 3, low: 1 };
        
        let completedPoints = 0;
        let totalBacklogPoints = 0;
        let completedTasksCount = 0;
        let totalTasksCount = events.length;

        for (const event of events) {
            const pts = priorityPoints[event.priority] || 3;
            if (event.status === 'completed') {
                completedPoints += pts;
                completedTasksCount++;
            } else {
                totalBacklogPoints += pts;
            }
        }

        const completionRate = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) : 0;
        
        // Estimate completion days needed for remaining backlog (assuming 5 pts per day velocity)
        const dailyVelocity = completedPoints > 0 ? (completedPoints / 7) : 5;
        const daysToCompleteBacklog = Math.ceil(totalBacklogPoints / Math.max(1, dailyVelocity));

        const targetCompletionDate = new Date();
        targetCompletionDate.setDate(targetCompletionDate.getDate() + daysToCompleteBacklog);

        return {
            totalTasksCount,
            completedTasksCount,
            completedStoryPoints: completedPoints,
            backlogStoryPoints: totalBacklogPoints,
            dailyVelocity: Math.round(dailyVelocity * 10) / 10,
            completionRatePercentage: Math.round(completionRate * 100),
            predictedDaysToFinish: daysToCompleteBacklog,
            targetCompletionDate: targetCompletionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        };
    }
}

module.exports = VelocityPredictor;

// ============================================
// Chart.js Module
// Renders analytics charts using Chart.js
// ============================================

const Charts = {
    completionChart: null,
    weeklyChart: null,
    priorityChart: null,

    // Get CSS variable value for chart colors
    getCSSVar(name) {
        return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    },

    // ==================
    // Render all charts with analytics data
    // ==================
    async renderAll() {
        try {
            const data = await API.getAnalytics();
            if (!data.success) return;

            const analytics = data.analytics;

            this.renderCompletionChart(analytics.completion);
            this.renderWeeklyChart(analytics.weekly);
            this.renderPriorityChart(analytics.priority);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        }
    },

    // ==================
    // Doughnut chart: Completed vs Pending
    // ==================
    renderCompletionChart(completion) {
        const ctx = document.getElementById('completionChart');
        if (!ctx) return;

        // Destroy existing chart if it exists
        if (this.completionChart) {
            this.completionChart.destroy();
        }

        const completed = completion.completed || 0;
        const pending = completion.pending || 0;
        const total = completed + pending;

        // If no tasks, show placeholder
        if (total === 0) {
            this.completionChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Tasks Yet'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e5e7eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'bottom' }
                    }
                }
            });
            return;
        }

        this.completionChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [completed, pending],
                    backgroundColor: ['#10b981', '#f59e0b'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            color: this.getCSSVar('--text-secondary') || '#64748b',
                            font: { size: 12, family: "'Inter', sans-serif" }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif" },
                        bodyFont: { family: "'Inter', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                const percentage = Math.round((context.raw / total) * 100);
                                return ` ${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // ==================
    // Bar chart: Weekly productivity
    // ==================
    renderWeeklyChart(weekly) {
        const ctx = document.getElementById('weeklyChart');
        if (!ctx) return;

        if (this.weeklyChart) {
            this.weeklyChart.destroy();
        }

        const labels = weekly.map(d => d.day);
        const counts = weekly.map(d => d.count);
        const textColor = this.getCSSVar('--text-muted') || '#94a3b8';
        const gridColor = this.getCSSVar('--border-color') || 'rgba(0,0,0,0.06)';

        this.weeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tasks Completed',
                    data: counts,
                    backgroundColor: 'rgba(99, 102, 241, 0.75)',
                    borderColor: 'rgba(99, 102, 241, 1)',
                    borderWidth: 1,
                    borderRadius: 6,
                    borderSkipped: false,
                    maxBarThickness: 40
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif" },
                        bodyFont: { family: "'Inter', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                return ` ${context.raw} task${context.raw !== 1 ? 's' : ''} completed`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1,
                            color: textColor,
                            font: { size: 11, family: "'Inter', sans-serif" }
                        },
                        grid: {
                            color: gridColor
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 11, family: "'Inter', sans-serif" }
                        },
                        grid: { display: false }
                    }
                }
            }
        });
    },

    // ==================
    // Doughnut chart: Priority distribution
    // ==================
    renderPriorityChart(priority) {
        const ctx = document.getElementById('priorityChart');
        if (!ctx) return;

        if (this.priorityChart) {
            this.priorityChart.destroy();
        }

        const data = [priority.low || 0, priority.medium || 0, priority.high || 0];
        const total = data.reduce((a, b) => a + b, 0);

        if (total === 0) {
            this.priorityChart = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: ['No Tasks Yet'],
                    datasets: [{
                        data: [1],
                        backgroundColor: ['#e5e7eb'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'bottom' }
                    }
                }
            });
            return;
        }

        this.priorityChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Low', 'Medium', 'High'],
                datasets: [{
                    data: data,
                    backgroundColor: ['#3b82f6', '#f59e0b', '#ef4444'],
                    borderWidth: 0,
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 10,
                            color: this.getCSSVar('--text-secondary') || '#64748b',
                            font: { size: 12, family: "'Inter', sans-serif" }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17, 24, 39, 0.9)',
                        padding: 12,
                        titleFont: { family: "'Inter', sans-serif" },
                        bodyFont: { family: "'Inter', sans-serif" },
                        callbacks: {
                            label: function(context) {
                                const percentage = Math.round((context.raw / total) * 100);
                                return ` ${context.label}: ${context.raw} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    },

    // Destroy all charts (cleanup)
    destroyAll() {
        if (this.completionChart) this.completionChart.destroy();
        if (this.weeklyChart) this.weeklyChart.destroy();
        if (this.priorityChart) this.priorityChart.destroy();
        this.completionChart = null;
        this.weeklyChart = null;
        this.priorityChart = null;
    }
};

// ============================================
// Dashboard Controller
// Provides statistics and analytics data
// ============================================

const { query } = require('../config/database');

// ==================
// Get dashboard statistics
// GET /api/dashboard/stats
// ==================
const getStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get all stats in a single efficient query
        const result = await query(
            `SELECT
                COUNT(*)::int AS total_tasks,
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed_tasks,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending_tasks,
                COUNT(*) FILTER (WHERE priority = 'high' AND status = 'pending')::int AS high_priority_tasks
             FROM tasks
             WHERE user_id = $1`,
            [userId]
        );

        const stats = result.rows[0];

        res.status(200).json({
            success: true,
            stats: {
                totalTasks: stats.total_tasks,
                completedTasks: stats.completed_tasks,
                pendingTasks: stats.pending_tasks,
                highPriorityTasks: stats.high_priority_tasks
            }
        });
    } catch (error) {
        console.error('Get stats error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard statistics.'
        });
    }
};

// ==================
// Get analytics data for charts
// GET /api/dashboard/analytics
// ==================
const getAnalytics = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Task completion breakdown (for doughnut chart)
        const completionResult = await query(
            `SELECT
                COUNT(*) FILTER (WHERE status = 'completed')::int AS completed,
                COUNT(*) FILTER (WHERE status = 'pending')::int AS pending
             FROM tasks
             WHERE user_id = $1`,
            [userId]
        );

        // 2. Weekly productivity (tasks completed in the last 7 days)
        const weeklyResult = await query(
            `SELECT
                TO_CHAR(completed_at::date, 'Dy') AS day_name,
                completed_at::date AS day,
                COUNT(*)::int AS count
             FROM tasks
             WHERE user_id = $1
               AND status = 'completed'
               AND completed_at >= CURRENT_DATE - INTERVAL '6 days'
             GROUP BY completed_at::date
             ORDER BY completed_at::date ASC`,
            [userId]
        );

        // Build a full 7-day array (fill in zeros for days with no completions)
        const weeklyData = [];
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = dayNames[date.getDay()];
            const found = weeklyResult.rows.find(r => {
                const rowDate = new Date(r.day).toISOString().split('T')[0];
                return rowDate === dateStr;
            });
            weeklyData.push({
                day: dayName,
                count: found ? found.count : 0
            });
        }

        // 3. Priority distribution
        const priorityResult = await query(
            `SELECT
                priority,
                COUNT(*)::int AS count
             FROM tasks
             WHERE user_id = $1
             GROUP BY priority`,
            [userId]
        );

        // Build the priority map
        const priorityData = { low: 0, medium: 0, high: 0 };
        priorityResult.rows.forEach(row => {
            priorityData[row.priority] = row.count;
        });

        // 4. Category distribution
        const categoryResult = await query(
            `SELECT
                category,
                COUNT(*)::int AS count
             FROM tasks
             WHERE user_id = $1
             GROUP BY category
             ORDER BY count DESC`,
            [userId]
        );

        res.status(200).json({
            success: true,
            analytics: {
                completion: completionResult.rows[0],
                weekly: weeklyData,
                priority: priorityData,
                categories: categoryResult.rows
            }
        });
    } catch (error) {
        console.error('Get analytics error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics data.'
        });
    }
};

module.exports = { getStats, getAnalytics };

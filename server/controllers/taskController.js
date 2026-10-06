// ============================================
// Task Controller
// Handles CRUD operations for tasks
// ============================================

const { query } = require('../config/database');

// ==================
// Get all tasks for the logged-in user
// GET /api/tasks
// Supports: search, filter, sort, pagination
// ==================
const getTasks = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            search,
            status,
            priority,
            category,
            date,       // 'today', 'upcoming', 'overdue'
            sort,       // 'newest', 'oldest', 'due_date', 'priority', 'updated'
            page = 1,
            limit = 50
        } = req.query;

        // Build the SQL query dynamically
        let sql = 'SELECT * FROM tasks WHERE user_id = $1';
        const params = [userId];
        let paramIndex = 2;

        // --- Search filter ---
        if (search) {
            sql += ` AND (LOWER(title) LIKE $${paramIndex} OR LOWER(description) LIKE $${paramIndex} OR LOWER(category) LIKE $${paramIndex})`;
            params.push(`%${search.toLowerCase()}%`);
            paramIndex++;
        }

        // --- Status filter ---
        if (status && status !== 'all') {
            sql += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        // --- Priority filter ---
        if (priority && priority !== 'all') {
            sql += ` AND priority = $${paramIndex}`;
            params.push(priority);
            paramIndex++;
        }

        // --- Category filter ---
        if (category && category !== 'all') {
            sql += ` AND category = $${paramIndex}`;
            params.push(category);
            paramIndex++;
        }

        // --- Date filter ---
        if (date === 'today') {
            sql += ` AND due_date = CURRENT_DATE`;
        } else if (date === 'upcoming') {
            sql += ` AND due_date > CURRENT_DATE`;
        } else if (date === 'overdue') {
            sql += ` AND due_date < CURRENT_DATE AND status = 'pending'`;
        }

        // --- Sorting ---
        switch (sort) {
            case 'oldest':
                sql += ' ORDER BY created_at ASC';
                break;
            case 'due_date':
                sql += ' ORDER BY due_date ASC NULLS LAST';
                break;
            case 'priority':
                sql += ` ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END ASC`;
                break;
            case 'updated':
                sql += ' ORDER BY updated_at DESC';
                break;
            case 'newest':
            default:
                sql += ' ORDER BY created_at DESC';
                break;
        }

        // --- Pagination ---
        const offset = (parseInt(page) - 1) * parseInt(limit);
        sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
        params.push(parseInt(limit), offset);

        const result = await query(sql, params);

        res.status(200).json({
            success: true,
            count: result.rows.length,
            tasks: result.rows
        });
    } catch (error) {
        console.error('Get tasks error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tasks.'
        });
    }
};

// ==================
// Get a single task by ID
// GET /api/tasks/:id
// ==================
const getTask = async (req, res) => {
    try {
        const result = await query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        res.status(200).json({
            success: true,
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Get task error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch task.'
        });
    }
};

// ==================
// Create a new task
// POST /api/tasks
// ==================
const createTask = async (req, res) => {
    try {
        const { title, description, category, priority, due_date, is_important } = req.body;
        const userId = req.user.id;

        // --- Validation ---
        if (!title || title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title is required.'
            });
        }

        if (title.trim().length > 255) {
            return res.status(400).json({
                success: false,
                message: 'Task title must be less than 255 characters.'
            });
        }

        // Validate priority
        const validPriorities = ['low', 'medium', 'high'];
        const taskPriority = priority && validPriorities.includes(priority.toLowerCase())
            ? priority.toLowerCase()
            : 'medium';

        // Validate category
        const validCategories = ['Work', 'Study', 'Personal', 'Project', 'Other'];
        const taskCategory = category && validCategories.includes(category) ? category : 'Other';

        const result = await query(
            `INSERT INTO tasks (user_id, title, description, category, priority, due_date, is_important)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [
                userId,
                title.trim(),
                description ? description.trim() : '',
                taskCategory,
                taskPriority,
                due_date || null,
                is_important || false
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Task created successfully!',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Create task error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to create task.'
        });
    }
};

// ==================
// Update a task
// PUT /api/tasks/:id
// ==================
const updateTask = async (req, res) => {
    try {
        const { title, description, category, priority, due_date, is_important, status } = req.body;
        const taskId = req.params.id;
        const userId = req.user.id;

        // Check if task exists and belongs to the user
        const existing = await query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        // Validate title if provided
        if (title !== undefined && title.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Task title cannot be empty.'
            });
        }

        // Build the update — use existing values as defaults
        const currentTask = existing.rows[0];

        // Determine completed_at
        let completedAt = currentTask.completed_at;
        const newStatus = status || currentTask.status;
        if (newStatus === 'completed' && currentTask.status !== 'completed') {
            completedAt = new Date();
        } else if (newStatus === 'pending') {
            completedAt = null;
        }

        const result = await query(
            `UPDATE tasks SET
                title = $1,
                description = $2,
                category = $3,
                priority = $4,
                due_date = $5,
                is_important = $6,
                status = $7,
                completed_at = $8,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $9 AND user_id = $10
             RETURNING *`,
            [
                title !== undefined ? title.trim() : currentTask.title,
                description !== undefined ? description.trim() : currentTask.description,
                category || currentTask.category,
                priority || currentTask.priority,
                due_date !== undefined ? (due_date || null) : currentTask.due_date,
                is_important !== undefined ? is_important : currentTask.is_important,
                newStatus,
                completedAt,
                taskId,
                userId
            ]
        );

        res.status(200).json({
            success: true,
            message: 'Task updated successfully!',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Update task error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update task.'
        });
    }
};

// ==================
// Toggle task completion
// PATCH /api/tasks/:id/complete
// ==================
const toggleComplete = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        // Find the task
        const existing = await query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        const currentTask = existing.rows[0];
        const newStatus = currentTask.status === 'completed' ? 'pending' : 'completed';
        const completedAt = newStatus === 'completed' ? new Date() : null;

        const result = await query(
            `UPDATE tasks SET status = $1, completed_at = $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $3 AND user_id = $4 RETURNING *`,
            [newStatus, completedAt, taskId, userId]
        );

        res.status(200).json({
            success: true,
            message: newStatus === 'completed' ? 'Task completed!' : 'Task marked as pending.',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Toggle complete error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update task status.'
        });
    }
};

// ==================
// Toggle task importance
// PATCH /api/tasks/:id/important
// ==================
const toggleImportant = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const existing = await query(
            'SELECT * FROM tasks WHERE id = $1 AND user_id = $2',
            [taskId, userId]
        );

        if (existing.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        const newImportant = !existing.rows[0].is_important;

        const result = await query(
            `UPDATE tasks SET is_important = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2 AND user_id = $3 RETURNING *`,
            [newImportant, taskId, userId]
        );

        res.status(200).json({
            success: true,
            message: newImportant ? 'Task marked as important.' : 'Task unmarked as important.',
            task: result.rows[0]
        });
    } catch (error) {
        console.error('Toggle important error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to update task importance.'
        });
    }
};

// ==================
// Delete a task
// DELETE /api/tasks/:id
// ==================
const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const result = await query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2 RETURNING id',
            [taskId, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Task not found.'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully!'
        });
    } catch (error) {
        console.error('Delete task error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Failed to delete task.'
        });
    }
};

module.exports = {
    getTasks,
    getTask,
    createTask,
    updateTask,
    toggleComplete,
    toggleImportant,
    deleteTask
};

// ============================================
// Task Routes
// All routes are protected (require authentication)
// ============================================

const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    toggleComplete,
    toggleImportant,
    deleteTask
} = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// Apply auth middleware to all task routes
router.use(authMiddleware);

// Task CRUD
router.get('/', getTasks);
router.get('/:id', getTask);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/complete', toggleComplete);
router.patch('/:id/important', toggleImportant);
router.delete('/:id', deleteTask);

module.exports = router;

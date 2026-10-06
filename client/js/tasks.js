// ============================================
// Tasks Module
// Handles task rendering, CRUD, and UI updates
// ============================================

const Tasks = {
    allTasks: [],          // Cache of all loaded tasks
    editingTaskId: null,   // Track which task is being edited
    deleteTaskId: null,    // Track which task is pending deletion
    currentView: 'all-tasks',

    // ==================
    // Format a date string for display
    // ==================
    formatDate(dateStr) {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const taskDate = new Date(date);
        taskDate.setHours(0, 0, 0, 0);

        const diffDays = Math.round((taskDate - today) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
    },

    // ==================
    // Check if a task is overdue
    // ==================
    isOverdue(task) {
        if (!task.due_date || task.status === 'completed') return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
    },

    // ==================
    // Render a single task card HTML
    // ==================
    renderTaskCard(task) {
        const isCompleted = task.status === 'completed';
        const overdue = this.isOverdue(task);

        // Build CSS classes for the card
        let cardClasses = 'task-card';
        if (isCompleted) cardClasses += ' completed';
        if (overdue) cardClasses += ' overdue';
        if (task.priority === 'high' && !isCompleted) cardClasses += ' high-priority';
        if (task.is_important && !isCompleted) cardClasses += ' important-task';

        return `
            <div class="${cardClasses}" data-task-id="${task.id}">
                <div class="custom-checkbox task-checkbox ${isCompleted ? 'checked' : ''}" 
                     onclick="Tasks.handleToggleComplete(${task.id})"
                     title="${isCompleted ? 'Mark as pending' : 'Mark as completed'}">
                </div>
                <div class="task-content">
                    <div class="task-title">${this.escapeHtml(task.title)}</div>
                    ${task.description ? `<div class="task-description">${this.escapeHtml(task.description)}</div>` : ''}
                    <div class="task-meta">
                        <span class="badge badge-${task.priority}">${task.priority}</span>
                        <span class="badge badge-category">${this.escapeHtml(task.category)}</span>
                        ${task.due_date ? `
                            <span class="task-due ${overdue ? 'overdue' : ''}">
                                <i class="fas fa-calendar"></i>
                                ${this.formatDate(task.due_date)}
                            </span>
                        ` : ''}
                        ${isCompleted && task.completed_at ? `
                            <span class="task-due">
                                <i class="fas fa-check-circle" style="color:var(--success);"></i>
                                Completed ${this.formatDate(task.completed_at)}
                            </span>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-action-btn important-btn ${task.is_important ? 'active' : ''}"
                            onclick="Tasks.handleToggleImportant(${task.id})"
                            title="${task.is_important ? 'Remove from important' : 'Mark as important'}">
                        <i class="fas fa-star"></i>
                    </button>
                    <button class="task-action-btn edit-btn"
                            onclick="Tasks.handleEdit(${task.id})"
                            title="Edit task">
                        <i class="fas fa-pen"></i>
                    </button>
                    <button class="task-action-btn delete-btn"
                            onclick="Tasks.handleDeleteClick(${task.id})"
                            title="Delete task">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    },

    // ==================
    // Render task list into container
    // ==================
    renderTaskList(tasks, containerId = 'task-list') {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyState();
            return;
        }

        container.innerHTML = tasks.map(task => this.renderTaskCard(task)).join('');
    },

    // ==================
    // Get the appropriate empty state message
    // ==================
    getEmptyState() {
        const emptyStates = {
            'all-tasks': {
                icon: 'fa-clipboard-list',
                title: 'No tasks yet',
                text: 'Create your first task to get started!'
            },
            'today': {
                icon: 'fa-calendar-check',
                title: "You're all caught up!",
                text: 'No tasks due today. Enjoy your free time!'
            },
            'upcoming': {
                icon: 'fa-calendar-week',
                title: 'No upcoming tasks',
                text: 'You have no tasks scheduled for the future.'
            },
            'completed': {
                icon: 'fa-trophy',
                title: 'No completed tasks',
                text: "Complete some tasks to see them here!"
            },
            'important': {
                icon: 'fa-star',
                title: 'No important tasks',
                text: 'Star tasks to mark them as important.'
            }
        };

        const state = emptyStates[this.currentView] || emptyStates['all-tasks'];

        return `
            <div class="empty-state">
                <div class="empty-state-icon">
                    <i class="fas ${state.icon}"></i>
                </div>
                <h3 class="empty-state-title">${state.title}</h3>
                <p class="empty-state-text">${state.text}</p>
                ${this.currentView !== 'completed' ? `
                    <button class="btn btn-primary" onclick="Tasks.openAddModal()">
                        <i class="fas fa-plus"></i> Add Task
                    </button>
                ` : ''}
            </div>
        `;
    },

    // ==================
    // Load tasks based on current view and filters
    // ==================
    async loadTasks(view = null) {
        if (view) this.currentView = view;

        const params = {};

        // Apply view-specific filters
        switch (this.currentView) {
            case 'today':
                params.date = 'today';
                break;
            case 'upcoming':
                params.date = 'upcoming';
                break;
            case 'completed':
                params.status = 'completed';
                break;
            case 'important':
                // We'll filter client-side after fetching
                break;
        }

        // Apply toolbar filters (only on the tasks view)
        const statusFilter = document.getElementById('filter-status');
        const priorityFilter = document.getElementById('filter-priority');
        const categoryFilter = document.getElementById('filter-category');
        const sortFilter = document.getElementById('filter-sort');

        if (statusFilter && this.currentView === 'all-tasks') {
            if (statusFilter.value !== 'all') params.status = statusFilter.value;
        }
        if (priorityFilter) {
            if (priorityFilter.value !== 'all') params.priority = priorityFilter.value;
        }
        if (categoryFilter) {
            if (categoryFilter.value !== 'all') params.category = categoryFilter.value;
        }
        if (sortFilter) {
            params.sort = sortFilter.value;
        }

        // Apply search
        const searchInput = document.getElementById('search-input');
        if (searchInput && searchInput.value.trim()) {
            params.search = searchInput.value.trim();
        }

        try {
            const data = await API.getTasks(params);
            if (!data.success) {
                showToast('Failed to load tasks.', 'error');
                return;
            }

            let tasks = data.tasks;

            // Client-side filter for "important" view
            if (this.currentView === 'important') {
                tasks = tasks.filter(t => t.is_important);
            }

            this.allTasks = tasks;
            this.renderTaskList(tasks);

            // Update count display
            const taskCount = document.getElementById('task-count');
            if (taskCount) {
                taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
            }

        } catch (error) {
            console.error('Load tasks error:', error);
            showToast('Failed to connect to server.', 'error');
        }
    },

    // ==================
    // Toggle task completion
    // ==================
    async handleToggleComplete(taskId) {
        try {
            const data = await API.toggleComplete(taskId);
            if (data.success) {
                showToast(data.message, 'success');
                await this.loadTasks();
                Dashboard.loadStats();
                if (Dashboard.currentSection === 'dashboard') {
                    Charts.renderAll();
                    Dashboard.loadTodayPreview();
                }
            }
        } catch (error) {
            showToast('Failed to update task.', 'error');
        }
    },

    // ==================
    // Toggle task importance
    // ==================
    async handleToggleImportant(taskId) {
        try {
            const data = await API.toggleImportant(taskId);
            if (data.success) {
                showToast(data.message, 'success');
                await this.loadTasks();
                Dashboard.updateNavCounts();
            }
        } catch (error) {
            showToast('Failed to update task.', 'error');
        }
    },

    // ==================
    // Open add task modal
    // ==================
    openAddModal() {
        this.editingTaskId = null;
        document.getElementById('modal-title').textContent = 'Add New Task';
        document.getElementById('modal-submit-text').textContent = 'Create Task';
        document.getElementById('task-form').reset();

        // Reset important checkbox
        const importantCb = document.getElementById('task-important-checkbox');
        importantCb.classList.remove('checked');

        // Open modal
        document.getElementById('task-modal-overlay').classList.add('active');
    },

    // ==================
    // Open edit task modal
    // ==================
    async handleEdit(taskId) {
        try {
            const data = await API.getTask(taskId);
            if (!data.success) {
                showToast('Task not found.', 'error');
                return;
            }

            const task = data.task;
            this.editingTaskId = taskId;

            document.getElementById('modal-title').textContent = 'Edit Task';
            document.getElementById('modal-submit-text').textContent = 'Save Changes';

            // Populate form fields
            document.getElementById('task-title').value = task.title;
            document.getElementById('task-description').value = task.description || '';
            document.getElementById('task-category').value = task.category || 'Other';
            document.getElementById('task-priority').value = task.priority || 'medium';
            document.getElementById('task-due-date').value = task.due_date ? task.due_date.split('T')[0] : '';

            const importantCb = document.getElementById('task-important-checkbox');
            if (task.is_important) {
                importantCb.classList.add('checked');
            } else {
                importantCb.classList.remove('checked');
            }

            // Open modal
            document.getElementById('task-modal-overlay').classList.add('active');
        } catch (error) {
            showToast('Failed to load task.', 'error');
        }
    },

    // ==================
    // Handle task form submission (create or update)
    // ==================
    async handleSubmit(e) {
        e.preventDefault();

        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const category = document.getElementById('task-category').value;
        const priority = document.getElementById('task-priority').value;
        const due_date = document.getElementById('task-due-date').value || null;
        const is_important = document.getElementById('task-important-checkbox').classList.contains('checked');

        if (!title) {
            showToast('Task title is required.', 'warning');
            return;
        }

        const submitBtn = document.getElementById('modal-submit');
        const submitText = document.getElementById('modal-submit-text');
        const submitSpinner = document.getElementById('modal-spinner');

        submitBtn.disabled = true;
        submitText.style.display = 'none';
        submitSpinner.style.display = 'block';

        try {
            let data;
            const taskData = { title, description, category, priority, due_date, is_important };

            if (this.editingTaskId) {
                data = await API.updateTask(this.editingTaskId, taskData);
            } else {
                data = await API.createTask(taskData);
            }

            if (data.success) {
                showToast(data.message, 'success');
                this.closeModal();
                await this.loadTasks();
                Dashboard.loadStats();
                Dashboard.updateNavCounts();
                if (Dashboard.currentSection === 'dashboard') {
                    Charts.renderAll();
                    Dashboard.loadTodayPreview();
                }
            } else {
                showToast(data.message || 'Failed to save task.', 'error');
            }
        } catch (error) {
            showToast('Server error. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitText.style.display = 'inline';
            submitSpinner.style.display = 'none';
        }
    },

    // ==================
    // Close task modal
    // ==================
    closeModal() {
        document.getElementById('task-modal-overlay').classList.remove('active');
        this.editingTaskId = null;
    },

    // ==================
    // Handle delete click — show confirm dialog
    // ==================
    handleDeleteClick(taskId) {
        this.deleteTaskId = taskId;
        document.getElementById('delete-modal-overlay').classList.add('active');
    },

    // ==================
    // Confirm deletion
    // ==================
    async confirmDelete() {
        if (!this.deleteTaskId) return;

        try {
            const data = await API.deleteTask(this.deleteTaskId);
            if (data.success) {
                showToast(data.message, 'success');
                this.closeDeleteModal();
                await this.loadTasks();
                Dashboard.loadStats();
                Dashboard.updateNavCounts();
                if (Dashboard.currentSection === 'dashboard') {
                    Charts.renderAll();
                    Dashboard.loadTodayPreview();
                }
            } else {
                showToast(data.message || 'Failed to delete task.', 'error');
            }
        } catch (error) {
            showToast('Failed to delete task.', 'error');
        }
    },

    // ==================
    // Close delete modal
    // ==================
    closeDeleteModal() {
        document.getElementById('delete-modal-overlay').classList.remove('active');
        this.deleteTaskId = null;
    },

    // ==================
    // HTML escape helper
    // ==================
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
};

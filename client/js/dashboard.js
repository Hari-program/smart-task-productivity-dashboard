// ============================================
// Dashboard Module
// Core controller for view switching, layout,
// theme toggling, stats loading, and task flows
// ============================================

const Dashboard = {
    currentSection: 'dashboard',
    searchDebounceTimer: null,

    // ==================
    // Initialize Dashboard
    // ==================
    async init() {
        // 1. Ensure user is authenticated
        if (!Auth.requireAuth()) {
            return;
        }

        // 2. Setup theme
        this.setupTheme();

        // 3. Setup user display info
        this.setupUser();

        // 4. Setup event listeners
        this.setupEventListeners();

        // 5. Load initial dashboard data
        await Promise.all([
            this.loadStats(),
            this.updateNavCounts(),
            this.loadTodayPreview()
        ]);

        // 6. Render charts
        if (typeof Charts !== 'undefined') {
            Charts.renderAll();
        }
    },

    // ==================
    // Setup User Info
    // ==================
    setupUser() {
        let user = Auth.getUser();

        const updateUI = (u) => {
            if (!u) return;
            const nameEl = document.getElementById('user-name');
            const avatarEl = document.getElementById('user-avatar');
            const settingsEmail = document.getElementById('settings-email');
            const settingsCreated = document.getElementById('settings-created');

            const name = u.name || 'User';
            if (nameEl) nameEl.textContent = name;

            // Generate initials (e.g. "Hariharan S" -> "HS")
            if (avatarEl) {
                const initials = name
                    .split(' ')
                    .filter(Boolean)
                    .map(part => part[0].toUpperCase())
                    .slice(0, 2)
                    .join('') || 'U';
                avatarEl.textContent = initials;
            }

            if (settingsEmail) settingsEmail.textContent = u.email || '—';
            if (settingsCreated) {
                if (u.created_at) {
                    const date = new Date(u.created_at);
                    settingsCreated.textContent = date.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                } else {
                    settingsCreated.textContent = 'Recently';
                }
            }
        };

        if (user) {
            updateUI(user);
        }

        // Fetch fresh profile data in background
        API.getMe()
            .then(data => {
                if (data && data.success && data.user) {
                    localStorage.setItem('user', JSON.stringify(data.user));
                    updateUI(data.user);
                }
            })
            .catch(err => console.warn('Could not refresh profile:', err));
    },

    // ==================
    // Setup Theme
    // ==================
    setupTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.applyTheme(savedTheme);
    },

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);

        const themeIcon = document.getElementById('theme-icon');
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }

        // Update active states on settings buttons
        const lightBtn = document.getElementById('settings-light');
        const darkBtn = document.getElementById('settings-dark');
        if (lightBtn && darkBtn) {
            if (theme === 'dark') {
                darkBtn.classList.remove('btn-secondary');
                darkBtn.classList.add('btn-primary');
                lightBtn.classList.remove('btn-primary');
                lightBtn.classList.add('btn-secondary');
            } else {
                lightBtn.classList.remove('btn-secondary');
                lightBtn.classList.add('btn-primary');
                darkBtn.classList.remove('btn-primary');
                darkBtn.classList.add('btn-secondary');
            }
        }
    },

    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme') || 'light';
        const next = current === 'dark' ? 'light' : 'dark';
        this.applyTheme(next);

        // Re-render charts so their gridlines and colors match theme
        if (this.currentSection === 'dashboard' && typeof Charts !== 'undefined') {
            Charts.renderAll();
        }
    },

    // ==================
    // Setup All Event Listeners
    // ==================
    setupEventListeners() {
        // --- Sidebar Navigation ---
        const navLinks = document.querySelectorAll('.sidebar-link[data-view], [data-view]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const view = link.getAttribute('data-view');
                if (view) {
                    this.switchView(view);
                }
            });
        });

        // --- Mobile Sidebar Controls ---
        const menuToggle = document.getElementById('menu-toggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebar-close');
        const sidebarOverlay = document.getElementById('sidebar-overlay');

        if (menuToggle && sidebar && sidebarOverlay) {
            menuToggle.addEventListener('click', () => {
                sidebar.classList.add('open');
                sidebarOverlay.classList.add('active');
            });
        }

        const closeMobileSidebar = () => {
            if (sidebar) sidebar.classList.remove('open');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        };

        if (sidebarClose) sidebarClose.addEventListener('click', closeMobileSidebar);
        if (sidebarOverlay) sidebarOverlay.addEventListener('click', closeMobileSidebar);

        // --- Theme Toggles ---
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        const settingsLight = document.getElementById('settings-light');
        if (settingsLight) {
            settingsLight.addEventListener('click', () => this.applyTheme('light'));
        }

        const settingsDark = document.getElementById('settings-dark');
        if (settingsDark) {
            settingsDark.addEventListener('click', () => this.applyTheme('dark'));
        }

        // --- User Menu Dropdown ---
        const userMenu = document.getElementById('user-menu');
        const userDropdown = document.getElementById('user-dropdown');
        if (userMenu && userDropdown) {
            userMenu.addEventListener('click', (e) => {
                e.stopPropagation();
                userDropdown.classList.toggle('active');
            });

            // Close dropdown when clicking anywhere outside
            document.addEventListener('click', (e) => {
                if (!userMenu.contains(e.target)) {
                    userDropdown.classList.remove('active');
                }
            });
        }

        const dropdownProfile = document.getElementById('dropdown-profile');
        if (dropdownProfile) {
            dropdownProfile.addEventListener('click', () => {
                if (userDropdown) userDropdown.classList.remove('active');
                this.switchView('settings');
            });
        }

        const dropdownSettings = document.getElementById('dropdown-settings');
        if (dropdownSettings) {
            dropdownSettings.addEventListener('click', () => {
                if (userDropdown) userDropdown.classList.remove('active');
                this.switchView('settings');
            });
        }

        // --- Logout Listeners ---
        const handleLogout = (e) => {
            e.preventDefault();
            Auth.logout();
        };

        const sidebarLogout = document.getElementById('sidebar-logout');
        const dropdownLogout = document.getElementById('dropdown-logout');
        const settingsLogout = document.getElementById('settings-logout');

        if (sidebarLogout) sidebarLogout.addEventListener('click', handleLogout);
        if (dropdownLogout) dropdownLogout.addEventListener('click', handleLogout);
        if (settingsLogout) settingsLogout.addEventListener('click', handleLogout);

        // --- Notification Button ---
        const notificationBtn = document.getElementById('notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                showToast("You're all caught up! No unread notifications.", 'info');
            });
        }

        // --- Search Input (Debounced) ---
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('input', () => {
                clearTimeout(this.searchDebounceTimer);
                this.searchDebounceTimer = setTimeout(() => {
                    const query = searchInput.value.trim();
                    // If in dashboard or settings view and user types a search, switch to all-tasks
                    if (query && (this.currentSection === 'dashboard' || this.currentSection === 'settings')) {
                        this.switchView('all-tasks');
                    } else if (this.currentSection !== 'dashboard' && this.currentSection !== 'settings') {
                        Tasks.loadTasks();
                    }
                }, 300);
            });
        }

        // --- Filter Selects ---
        ['filter-status', 'filter-priority', 'filter-category', 'filter-sort'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', () => {
                    Tasks.loadTasks();
                });
            }
        });

        // --- Add Task Modal Triggers ---
        const addTaskBtn = document.getElementById('add-task-btn');
        if (addTaskBtn) {
            addTaskBtn.addEventListener('click', () => {
                Tasks.openAddModal();
            });
        }

        // --- Task Form Submit ---
        const taskForm = document.getElementById('task-form');
        if (taskForm) {
            taskForm.addEventListener('submit', (e) => Tasks.handleSubmit(e));
        }

        // --- Task Modal Close ---
        const modalClose = document.getElementById('modal-close');
        const modalCancel = document.getElementById('modal-cancel');
        const taskModalOverlay = document.getElementById('task-modal-overlay');

        if (modalClose) modalClose.addEventListener('click', () => Tasks.closeModal());
        if (modalCancel) modalCancel.addEventListener('click', () => Tasks.closeModal());
        if (taskModalOverlay) {
            taskModalOverlay.addEventListener('click', (e) => {
                if (e.target === taskModalOverlay) Tasks.closeModal();
            });
        }

        // --- Important Checkbox Toggle in Modal ---
        const importantCheckbox = document.getElementById('task-important-checkbox');
        if (importantCheckbox) {
            importantCheckbox.addEventListener('click', () => {
                importantCheckbox.classList.toggle('checked');
            });
        }

        // --- Delete Confirmation Modal ---
        const deleteCancel = document.getElementById('delete-cancel');
        const deleteConfirm = document.getElementById('delete-confirm');
        const deleteModalOverlay = document.getElementById('delete-modal-overlay');

        if (deleteCancel) deleteCancel.addEventListener('click', () => Tasks.closeDeleteModal());
        if (deleteConfirm) deleteConfirm.addEventListener('click', () => Tasks.confirmDelete());
        if (deleteModalOverlay) {
            deleteModalOverlay.addEventListener('click', (e) => {
                if (e.target === deleteModalOverlay) Tasks.closeDeleteModal();
            });
        }

        // --- Keyboard Shortcuts ---
        document.addEventListener('keydown', (e) => {
            // Escape closes modals and dropdown
            if (e.key === 'Escape') {
                Tasks.closeModal();
                Tasks.closeDeleteModal();
                if (userDropdown) userDropdown.classList.remove('active');
            }
            // '/' focuses search if not inside an input/textarea
            if (e.key === '/' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
                if (searchInput) {
                    e.preventDefault();
                    searchInput.focus();
                }
            }
        });
    },

    // ==================
    // Switch View
    // ==================
    switchView(viewName) {
        this.currentSection = viewName;

        // Close mobile sidebar if open
        const sidebar = document.getElementById('sidebar');
        const sidebarOverlay = document.getElementById('sidebar-overlay');
        if (sidebar) sidebar.classList.remove('open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');

        // Update active class on sidebar links
        document.querySelectorAll('.sidebar-nav .sidebar-link').forEach(link => {
            const linkView = link.getAttribute('data-view');
            if (linkView === viewName) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        // References to view sections
        const viewDashboard = document.getElementById('view-dashboard');
        const viewTasks = document.getElementById('view-tasks');
        const viewSettings = document.getElementById('view-settings');
        const pageTitle = document.getElementById('page-title');
        const taskListTitle = document.getElementById('task-list-title');

        // View title configuration
        const titles = {
            'dashboard': 'Dashboard',
            'all-tasks': 'All Tasks',
            'today': "Today's Tasks",
            'upcoming': 'Upcoming Tasks',
            'completed': 'Completed Tasks',
            'important': 'Important Tasks',
            'settings': 'Settings'
        };

        if (pageTitle) {
            pageTitle.textContent = titles[viewName] || 'Dashboard';
        }

        // Hide all views first
        if (viewDashboard) viewDashboard.style.display = 'none';
        if (viewTasks) viewTasks.style.display = 'none';
        if (viewSettings) viewSettings.style.display = 'none';

        if (viewName === 'dashboard') {
            if (viewDashboard) viewDashboard.style.display = 'block';
            this.loadStats();
            this.loadTodayPreview();
            if (typeof Charts !== 'undefined') {
                Charts.renderAll();
            }
            this.updateNavCounts();
        } else if (viewName === 'settings') {
            if (viewSettings) viewSettings.style.display = 'block';
            this.setupUser();
        } else {
            // Task views: all-tasks, today, upcoming, completed, important
            if (viewTasks) viewTasks.style.display = 'block';
            if (taskListTitle) {
                taskListTitle.textContent = titles[viewName] || 'Tasks';
            }

            // Adjust status filter visibility if on completed view
            const statusFilter = document.getElementById('filter-status');
            if (statusFilter) {
                if (viewName === 'completed') {
                    statusFilter.value = 'completed';
                    statusFilter.disabled = true;
                } else {
                    statusFilter.disabled = false;
                    if (statusFilter.value === 'completed' && viewName !== 'all-tasks') {
                        statusFilter.value = 'all';
                    }
                }
            }

            // Load tasks for this view
            Tasks.loadTasks(viewName);
            this.updateNavCounts();
        }
    },

    // ==================
    // Load Stats from API
    // ==================
    async loadStats() {
        try {
            const data = await API.getStats();
            if (data && data.success && data.stats) {
                const { totalTasks, completedTasks, pendingTasks, highPriorityTasks } = data.stats;

                const setStat = (id, val) => {
                    const el = document.getElementById(id);
                    if (el) el.textContent = val !== undefined ? val : 0;
                };

                setStat('stat-total', totalTasks);
                setStat('stat-completed', completedTasks);
                setStat('stat-pending', pendingTasks);
                setStat('stat-high-priority', highPriorityTasks);

                // Update nav counts based on stats
                const navAll = document.getElementById('nav-count-all');
                const navCompleted = document.getElementById('nav-count-completed');
                if (navAll) navAll.textContent = totalTasks || 0;
                if (navCompleted) navCompleted.textContent = completedTasks || 0;
            }
        } catch (error) {
            console.error('Failed to load stats:', error);
        }
    },

    // ==================
    // Update Navigation Count Badges
    // ==================
    async updateNavCounts() {
        try {
            // 1. Fetch overall stats for all & completed
            const statsData = await API.getStats();
            if (statsData && statsData.success && statsData.stats) {
                const navAll = document.getElementById('nav-count-all');
                const navCompleted = document.getElementById('nav-count-completed');
                if (navAll) navAll.textContent = statsData.stats.totalTasks || 0;
                if (navCompleted) navCompleted.textContent = statsData.stats.completedTasks || 0;
            }

            // 2. Fetch today tasks count
            const todayData = await API.getTasks({ date: 'today' });
            if (todayData && todayData.success && todayData.tasks) {
                const navToday = document.getElementById('nav-count-today');
                if (navToday) navToday.textContent = todayData.tasks.length;
            }

            // 3. Fetch all tasks to get important count
            const allTasksData = await API.getTasks();
            if (allTasksData && allTasksData.success && allTasksData.tasks) {
                const importantCount = allTasksData.tasks.filter(t => t.is_important).length;
                const navImportant = document.getElementById('nav-count-important');
                if (navImportant) navImportant.textContent = importantCount;
            }
        } catch (error) {
            console.warn('Could not refresh nav counts:', error);
        }
    },

    // ==================
    // Load Today's Tasks Preview for Dashboard View
    // ==================
    async loadTodayPreview() {
        const previewContainer = document.getElementById('today-tasks-preview');
        if (!previewContainer) return;

        try {
            const data = await API.getTasks({ date: 'today' });
            if (data && data.success) {
                const tasks = data.tasks || [];

                if (tasks.length === 0) {
                    previewContainer.innerHTML = `
                        <div class="empty-state" style="padding:32px 16px;">
                            <div class="empty-state-icon" style="width:48px; height:48px; font-size:1.25rem;">
                                <i class="fas fa-calendar-check"></i>
                            </div>
                            <h3 class="empty-state-title" style="font-size:1rem;">All caught up!</h3>
                            <p class="empty-state-text" style="font-size:0.85rem; margin-bottom:12px;">No tasks scheduled for today.</p>
                            <button class="btn btn-secondary btn-sm" onclick="Tasks.openAddModal()">
                                <i class="fas fa-plus"></i> Add Task
                            </button>
                        </div>
                    `;
                    return;
                }

                // Render tasks (limit to top 5 preview)
                const previewTasks = tasks.slice(0, 5);
                previewContainer.innerHTML = previewTasks.map(task => Tasks.renderTaskCard(task)).join('');
            }
        } catch (error) {
            console.error('Failed to load today preview:', error);
            previewContainer.innerHTML = `
                <div style="padding:20px; text-align:center; color:var(--text-muted); font-size:0.9rem;">
                    Failed to load today's tasks.
                </div>
            `;
        }
    }
};

// ==================
// Initialize on DOM Ready
// ==================
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

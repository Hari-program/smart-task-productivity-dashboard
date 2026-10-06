// ============================================
// API Client Module
// Centralizes all API calls using the Fetch API
// ============================================

const API_BASE = '/api';

const API = {
    // ==================
    // Helper: make an authenticated API request
    // ==================
    async request(endpoint, options = {}) {
        const token = localStorage.getItem('token');
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_BASE}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            // If unauthorized, redirect to login
            if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                    window.location.href = '/login';
                }
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // ==================
    // Auth Endpoints
    // ==================
    register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },

    login(credentials) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });
    },

    getMe() {
        return this.request('/auth/me');
    },

    logout() {
        return this.request('/auth/logout', { method: 'POST' });
    },

    // ==================
    // Task Endpoints
    // ==================
    getTasks(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `/tasks?${queryString}` : '/tasks';
        return this.request(url);
    },

    getTask(id) {
        return this.request(`/tasks/${id}`);
    },

    createTask(taskData) {
        return this.request('/tasks', {
            method: 'POST',
            body: JSON.stringify(taskData)
        });
    },

    updateTask(id, taskData) {
        return this.request(`/tasks/${id}`, {
            method: 'PUT',
            body: JSON.stringify(taskData)
        });
    },

    toggleComplete(id) {
        return this.request(`/tasks/${id}/complete`, { method: 'PATCH' });
    },

    toggleImportant(id) {
        return this.request(`/tasks/${id}/important`, { method: 'PATCH' });
    },

    deleteTask(id) {
        return this.request(`/tasks/${id}`, { method: 'DELETE' });
    },

    // ==================
    // Dashboard Endpoints
    // ==================
    getStats() {
        return this.request('/dashboard/stats');
    },

    getAnalytics() {
        return this.request('/dashboard/analytics');
    }
};

// ============================================
// Toast Notification System
// ============================================
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const icons = {
        success: 'fa-circle-check',
        error: 'fa-circle-exclamation',
        warning: 'fa-triangle-exclamation',
        info: 'fa-circle-info'
    };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${icons[type] || icons.info} toast-icon"></i>
        <span class="toast-message">${message}</span>
        <button class="toast-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    container.appendChild(toast);

    // Auto-remove after duration
    setTimeout(() => {
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

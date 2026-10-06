// ============================================
// Authentication Helper Module
// Handles auth state checking and user session
// ============================================

const Auth = {
    // Check if user is authenticated
    isAuthenticated() {
        return !!localStorage.getItem('token');
    },

    // Get the stored token
    getToken() {
        return localStorage.getItem('token');
    },

    // Get stored user data
    getUser() {
        try {
            return JSON.parse(localStorage.getItem('user'));
        } catch {
            return null;
        }
    },

    // Save authentication data
    saveAuth(token, user) {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Clear authentication data
    clearAuth() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Logout and redirect
    async logout() {
        try {
            await API.logout();
        } catch (e) {
            // Even if the API call fails, clear local data
        }
        this.clearAuth();
        window.location.href = '/login';
    },

    // Protect a page — redirect to login if not authenticated
    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = '/login';
            return false;
        }
        return true;
    }
};

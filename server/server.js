// ============================================
// Smart Task & Productivity Dashboard
// Main Server Entry Point
// ============================================

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// Middleware
// ============================================

// Security headers
app.use(helmet({
    contentSecurityPolicy: false,  // Disable CSP for development (allows inline scripts)
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON request bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, '..', 'client')));

// ============================================
// API Routes
// ============================================

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ============================================
// Serve Frontend Pages
// ============================================

// Landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'index.html'));
});

// Login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'login.html'));
});

// Register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'register.html'));
});

// Dashboard page
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'client', 'dashboard.html'));
});

// ============================================
// Error Handling
// ============================================

// 404 handler for API routes
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'API endpoint not found.'
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server error:', err.stack);
    res.status(500).json({
        success: false,
        message: 'Internal server error.'
    });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║   Smart Task & Productivity Dashboard            ║
║   Server running on http://localhost:${PORT}        ║
╚══════════════════════════════════════════════════╝
    `);
});

module.exports = app;

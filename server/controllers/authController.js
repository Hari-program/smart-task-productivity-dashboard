// ============================================
// Authentication Controller
// Handles user registration, login, and profile
// ============================================

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Generate a JWT token for a user
const generateToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, name: user.name },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );
};

// ==================
// Register a new user
// POST /api/auth/register
// ==================
const register = async (req, res) => {
    try {
        const { name, email, password, confirmPassword } = req.body;

        // --- Validation ---
        if (!name || !email || !password || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.'
            });
        }

        // Validate name length
        if (name.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Name must be at least 2 characters long.'
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid email address.'
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long.'
            });
        }

        // Check password confirmation
        if (password !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        // Check if email already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (existingUser.rows.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'An account with this email already exists.'
            });
        }

        // Hash the password (10 salt rounds)
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert the new user into the database
        const result = await query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
            [name.trim(), email.toLowerCase(), hashedPassword]
        );

        const newUser = result.rows[0];

        // Generate a JWT token
        const token = generateToken(newUser);

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                created_at: newUser.created_at
            }
        });
    } catch (error) {
        console.error('Registration error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// ==================
// Login an existing user
// POST /api/auth/login
// ==================
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // --- Validation ---
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        // Find user by email
        const result = await query(
            'SELECT id, name, email, password, created_at FROM users WHERE email = $1',
            [email.toLowerCase()]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        const user = result.rows[0];

        // Compare the provided password with the stored hash
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }

        // Generate a JWT token
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                created_at: user.created_at
            }
        });
    } catch (error) {
        console.error('Login error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// ==================
// Get current user profile
// GET /api/auth/me
// ==================
const getMe = async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, email, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found.'
            });
        }

        res.status(200).json({
            success: true,
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Get profile error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
};

// ==================
// Logout (client-side token removal, server acknowledges)
// POST /api/auth/logout
// ==================
const logout = (req, res) => {
    // JWT is stateless — the client simply discards the token
    res.status(200).json({
        success: true,
        message: 'Logged out successfully.'
    });
};

module.exports = { register, login, getMe, logout };

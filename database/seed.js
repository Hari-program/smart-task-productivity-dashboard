// ============================================
// Database Seed Script
// Creates sample tasks for testing
// Run: npm run seed
// ============================================

const bcrypt = require('bcryptjs');
const { pool, query } = require('../server/config/database');

const seedData = async () => {
    try {
        console.log('🌱 Starting database seed...');

        // Create a sample user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);

        const userResult = await query(
            `INSERT INTO users (name, email, password)
             VALUES ($1, $2, $3)
             ON CONFLICT (email) DO UPDATE SET name = $1
             RETURNING id`,
            ['Hariharan', 'hariharan@example.com', hashedPassword]
        );

        const userId = userResult.rows[0].id;
        console.log(`✅ Sample user created (ID: ${userId})`);

        // Sample tasks
        const tasks = [
            {
                title: 'Complete Java Assignment',
                description: 'Finish the Object-Oriented Programming assignment on inheritance and polymorphism. Submit before deadline.',
                category: 'Study',
                priority: 'high',
                due_date: getTodayOffset(1),
                is_important: true
            },
            {
                title: 'Prepare Robotics Seminar',
                description: 'Create slides for the robotics seminar presentation. Include demo videos and diagrams.',
                category: 'Study',
                priority: 'high',
                due_date: getTodayOffset(3),
                is_important: true
            },
            {
                title: 'Build Portfolio Website',
                description: 'Design and develop a personal portfolio website using HTML, CSS, and JavaScript. Deploy on GitHub Pages.',
                category: 'Project',
                priority: 'medium',
                due_date: getTodayOffset(7),
                is_important: false
            },
            {
                title: 'Study PostgreSQL',
                description: 'Learn advanced PostgreSQL concepts: joins, indexes, views, and stored procedures.',
                category: 'Study',
                priority: 'medium',
                due_date: getTodayOffset(2),
                is_important: false
            },
            {
                title: 'Complete Internship Application',
                description: 'Apply for summer internship at tech companies. Update resume and prepare cover letter.',
                category: 'Work',
                priority: 'high',
                due_date: getTodayOffset(0),
                is_important: true
            },
            {
                title: 'Fix Bug in API Server',
                description: 'Investigate and fix the authentication timeout issue on the express server.',
                category: 'Project',
                priority: 'high',
                due_date: getTodayOffset(0),
                is_important: false
            },
            {
                title: 'Read Clean Code Book',
                description: 'Continue reading "Clean Code" by Robert C. Martin. Complete chapters 5-8.',
                category: 'Personal',
                priority: 'low',
                due_date: getTodayOffset(14),
                is_important: false
            },
            {
                title: 'Team Meeting Notes',
                description: 'Organize and share notes from the last team standup meeting with all members.',
                category: 'Work',
                priority: 'low',
                due_date: getTodayOffset(-1),
                is_important: false
            },
            {
                title: 'Setup CI/CD Pipeline',
                description: 'Configure GitHub Actions for continuous integration and deployment for the main project.',
                category: 'Project',
                priority: 'medium',
                due_date: getTodayOffset(5),
                is_important: true
            },
            {
                title: 'Gym Workout Plan',
                description: 'Create a weekly workout schedule and meal plan. Start tracking progress.',
                category: 'Personal',
                priority: 'low',
                due_date: getTodayOffset(0),
                is_important: false
            },
            {
                title: 'Database Optimization Review',
                description: 'Review current database queries for performance. Add missing indexes and optimize slow queries.',
                category: 'Work',
                priority: 'medium',
                due_date: getTodayOffset(4),
                is_important: false
            },
            {
                title: 'Write Blog Post on Node.js',
                description: 'Draft a technical blog post about building REST APIs with Node.js and Express.',
                category: 'Personal',
                priority: 'low',
                due_date: getTodayOffset(10),
                is_important: false
            }
        ];

        // Insert tasks
        for (const task of tasks) {
            await query(
                `INSERT INTO tasks (user_id, title, description, category, priority, due_date, is_important)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [userId, task.title, task.description, task.category, task.priority, task.due_date, task.is_important]
            );
        }

        // Mark a couple of tasks as completed for analytics
        await query(
            `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP - INTERVAL '1 day'
             WHERE user_id = $1 AND title = 'Team Meeting Notes'`,
            [userId]
        );
        await query(
            `UPDATE tasks SET status = 'completed', completed_at = CURRENT_TIMESTAMP
             WHERE user_id = $1 AND title = 'Gym Workout Plan'`,
            [userId]
        );

        console.log(`✅ ${tasks.length} sample tasks created`);
        console.log('\n📧 Test Credentials:');
        console.log('   Email:    hariharan@example.com');
        console.log('   Password: password123\n');
        console.log('🌱 Seed completed successfully!');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Seed error:', error.message);
        await pool.end();
        process.exit(1);
    }
};

// Helper: get a date offset from today
function getTodayOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
}

seedData();

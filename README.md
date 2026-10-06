# TaskFlow — Smart Task & Productivity Dashboard

A modern, full-stack productivity web application built with **Node.js, Express, PostgreSQL, and vanilla HTML/CSS/JavaScript**. TaskFlow delivers a sleek, responsive SaaS dashboard experience with real-time analytics, task management, JWT authentication, and dark mode support — with **zero frontend framework overhead**.

---

## 🚀 Live Demo & Screenshots

- **Landing Page**: Modern hero section, product highlights, responsive navigation, and instant theme toggle.
- **Interactive Dashboard**: KPI statistics cards, Chart.js task completion doughnut, weekly productivity velocity bar chart, and priority distribution.
- **Task Management**: Full CRUD, category badges, dynamic priority tags, due date tracking with overdue indicators, importance stars, and debounced instant search.
- **Clean Aesthetic**: Glassmorphism accents, curated HSL color palette, smooth micro-interactions, skeleton loaders, and custom toast notifications.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | Vanilla HTML5, CSS3, JavaScript (ES6+) | No heavy UI libraries. Native Fetch API, CSS custom properties. |
| **Data Visualization** | Chart.js 4.4 | Doughnut & bar charts with dynamic theme adaptation. |
| **Icons & Typography** | Font Awesome 6, Inter (Google Fonts) | Clean typography and modern vector iconography. |
| **Backend** | Node.js, Express.js | RESTful routing, modular MVC architecture, parameterized SQL. |
| **Database** | PostgreSQL | Relational schema with foreign keys (`ON DELETE CASCADE`), indexes, constraints. |
| **Security** | bcryptjs, jsonwebtoken (JWT), Helmet, CORS | Salted password hashing, stateless Bearer token auth, secure HTTP headers. |

---

## 📁 Project Structure

```text
Smart Task & Productivity Dashboard/
│
├── client/                      # Frontend static client
│   ├── css/
│   │   ├── style.css            # Core design system tokens, themes & components
│   │   ├── dashboard.css        # Dashboard layout, sidebar, stats & task cards
│   │   └── responsive.css       # Responsive breakpoints (1024px, 768px, 480px)
│   ├── js/
│   │   ├── api.js               # Centralized Fetch API wrapper & toast system
│   │   ├── auth.js              # Token management & route protection helper
│   │   ├── charts.js            # Chart.js analytics controller
│   │   ├── tasks.js             # Task rendering, modal workflows & CRUD
│   │   └── dashboard.js         # View routing, event listeners & initialization
│   ├── index.html               # Public landing page
│   ├── login.html               # Sign in page
│   ├── register.html            # Registration page with live password strength meter
│   └── dashboard.html           # Main dashboard app & modals
│
├── server/                      # Backend API server
│   ├── config/
│   │   └── database.js          # PostgreSQL connection pool (pg.Pool)
│   ├── controllers/
│   │   ├── authController.js    # Register, login, getMe, logout
│   │   ├── taskController.js    # Filtered task queries, CRUD, toggle complete/important
│   │   └── dashboardController.js# Aggregated KPI metrics & analytics calculations
│   ├── middleware/
│   │   └── authMiddleware.js    # JWT verification & protected route guard
│   ├── routes/
│   │   ├── authRoutes.js        # /api/auth routes
│   │   ├── taskRoutes.js        # /api/tasks routes
│   │   └── dashboardRoutes.js   # /api/dashboard routes
│   └── server.js                # Express app entry point & static file routing
│
├── database/                    # Database migrations & seeds
│   ├── schema.sql               # PostgreSQL tables, constraints & performance indexes
│   └── seed.js                  # Database seeder with sample user & 12 realistic tasks
│
├── .env.example                 # Environment configuration template
├── package.json                 # Node dependencies and npm scripts
└── README.md                    # Project documentation
```

---

## ⚡ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v16.x or higher) — [Download Node.js](https://nodejs.org/)
- **PostgreSQL** (v13.x or higher) — [Download PostgreSQL](https://www.postgresql.org/download/)

---

### 1. Clone & Install Dependencies

```bash
cd "Smart Task & Productivity Dashboard"
npm install
```

---

### 2. Configure PostgreSQL Database

1. Open your terminal or `psql` shell:
   ```sql
   CREATE DATABASE smart_task_dashboard;
   ```

2. Execute the schema file:
   ```bash
   psql -U postgres -d smart_task_dashboard -f database/schema.sql
   ```
   *(Or copy and paste the contents of `database/schema.sql` into pgAdmin / DBeaver / your SQL tool).*

---

### 3. Environment Variables Setup

Create a `.env` file in the project root directory (you can copy `.env.example`):

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL database credentials:

```env
PORT=5000
NODE_ENV=development

# PostgreSQL Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=smart_task_dashboard
DB_USER=postgres
DB_PASSWORD=your_postgres_password_here

# JWT Secret Key
JWT_SECRET=super_secret_jwt_key_taskflow_production_ready
JWT_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5000
```

---

### 4. (Optional) Seed Sample Data

To populate the database with a pre-configured user and 12 sample tasks across multiple categories, priorities, and dates:

```bash
npm run db:seed
```

**Default Test Credentials:**
- **Email**: `hariharan@example.com`
- **Password**: `password123`

---

### 5. Run the Application

Start the development server with automatic file watching:

```bash
npm run dev
```

Or run standard production mode:

```bash
npm start
```

Visit **`http://localhost:5000`** in your browser.

---

## 📡 API Reference

All protected routes require a Bearer token in the request header:  
`Authorization: Bearer <your_jwt_token>`

### Authentication Endpoints (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new user account | No |
| `POST` | `/api/auth/login` | Authenticate user & return JWT | No |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Yes |
| `POST` | `/api/auth/logout` | Client logout invalidate notice | Yes |

### Tasks Endpoints (`/api/tasks`)
| Method | Endpoint | Query Parameters | Description |
|---|---|---|---|
| `GET` | `/api/tasks` | `search`, `status`, `priority`, `category`, `date`, `sort`, `page`, `limit` | Fetch user's tasks with dynamic SQL filtering |
| `POST` | `/api/tasks` | — | Create a new task |
| `GET` | `/api/tasks/:id` | — | Fetch single task by ID |
| `PUT` | `/api/tasks/:id` | — | Update task details |
| `PATCH`| `/api/tasks/:id/complete` | — | Toggle completed status |
| `PATCH`| `/api/tasks/:id/important`| — | Toggle important star |
| `DELETE`| `/api/tasks/:id` | — | Delete task permanently |

### Dashboard Analytics (`/api/dashboard`)
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/dashboard/stats` | Aggregated KPI stats (total, completed, pending, high-priority) |
| `GET` | `/api/dashboard/analytics` | Analytics datasets for completion ratio, weekly velocity, and priority breakdown |

---

## 💡 Architecture & Communication Flow

```text
┌─────────────────┐       HTTP / JSON        ┌─────────────────────────┐
│                 │  ─────────────────────>  │                         │
│  Client Browser │   (Bearer JWT Header)    │  Express REST API       │
│  Vanilla JS/DOM │                          │  Middleware + Auth Guard│
│                 │  <─────────────────────  │                         │
└─────────────────┘       JSON Responses     └────────────┬────────────┘
                                                          │
                                            Parameterized │ pg.Pool
                                             SQL Queries  │ Connection
                                                          ▼
                                             ┌─────────────────────────┐
                                             │                         │
                                             │   PostgreSQL Database   │
                                             │   Users & Tasks Tables  │
                                             │                         │
                                             └─────────────────────────┘
```

1. **Client-Side Requests**: When a user interacts with the UI, `api.js` intercepts the action, attaches the stored JWT from `localStorage`, and triggers an asynchronous `fetch()` request.
2. **Server-Side Security**: Express routes pass requests through `authMiddleware.js`, verifying the JWT signature and appending `req.user = decoded` to the request pipeline.
3. **Database Isolation**: Controllers execute parameterized SQL statements using `pg.Pool`, guaranteeing complete data separation per `user_id` and immunity against SQL injection attacks.
4. **State & DOM Synchronization**: Responses trigger targeted DOM updates, Chart.js chart rebuilds, and optimistic notification toasts without page reloads.

---

## 🔒 Security Best Practices Implemented

- **Password Hashing**: Salts and hashes passwords via `bcryptjs` (salt rounds: 10).
- **Stateless Tokens**: Signs tokens via `jsonwebtoken` with configurable expiration.
- **SQL Injection Prevention**: 100% of database queries utilize `$1, $2, ...` parameterized bindings.
- **HTTP Header Hardening**: Integrated `helmet` middleware for XSS, MIME-sniffing, and clickjacking protection.
- **Cross-Origin Resource Sharing**: Configured `cors` middleware restricting unauthorized origins.
- **Input Sanitization**: Client and server-side validation on email formats, password constraints, and string lengths.

---

## 🎯 Possible Future Enhancements

- [ ] Recurring tasks (daily, weekly, monthly recurrence patterns)
- [ ] Task tags and custom color labels
- [ ] File attachments and markdown preview inside task descriptions
- [ ] Browser push notifications for tasks due in under 1 hour
- [ ] Drag-and-drop Kanban view option alongside list view
- [ ] Export tasks to CSV / JSON format

---

## 📄 License

This project is licensed under the MIT License. Feel free to use it for learning, demonstration, and personal projects!

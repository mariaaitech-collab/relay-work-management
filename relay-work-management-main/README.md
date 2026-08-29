# ⚡ EmpTrack Pro — Employee Performance & Tracking System

EmpTrack Pro is a full-stack, enterprise-grade Employee Performance & Attendance Tracking Portal built with **React (Vite)**, **Tailwind CSS**, **Node.js / Express**, and **MongoDB (Mongoose)**. 

Designed with a modern **Craftive Labs Lavender UI System**, it provides real-time performance score analytics, daily check-in attendance, work submission tracking with screenshot upload & GitHub repository verification, and broadcast notifications.

---

## 🎨 Key Features

### 👑 Admin Portal
- **Executive Analytics Dashboard**: Overview of total employees, team average score, and at-risk employee counts.
- **Employee Directory**: Searchable list with quick actions to view detailed histories, edit details, update scores, or delete accounts.
- **Score Override & Audit Logs**: Manually adjust performance scores with audit trail logging.
- **Broadcast Announcements**: Send targeted or organization-wide notifications to employees.
- **Employee Registration**: Register new employee accounts directly from the admin panel.

### 👤 Employee Portal
- **Daily Attendance Check-in**: One-click daily check-in with attendance history tracking.
- **Proof of Work Submission**: Upload daily work screenshots (Cloudinary integration) and GitHub repository links.
- **Dynamic Performance Gauge**: Visual score gauge with automated status indicators (`Active`, `Warning`, `Blocked`).
- **Interactive Daily Checklist**: Clear checklist items for daily tasks and requirements.
- **Notification Center**: Real-time notification inbox for admin announcements.

### 🗄️ Database & Fallback Layer
- **MongoDB & Mongoose ORM**: Schema definitions for `User`, `ProofOfWork`, `Attendance`, `Notification`, and `ScoreHistory`.
- **Zero-Config Fallback**: Includes `mongodb-memory-server` fallback — if local or MongoDB Atlas instances are unreachable, an in-memory database automatically initializes for instant development!
- **Auto-Seeding**: Automatically seeds initial default Admin and Employee accounts upon first startup.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite, Tailwind CSS, Axios, React Router v7, Plus Jakarta Sans typography
- **Backend**: Node.js, Express.js, Mongoose (MongoDB ORM), JWT Authentication, Bcrypt, Multer, Cloudinary, Express Rate Limit
- **Database**: MongoDB / Mongoose (with in-memory fallback)

---

## 🔑 Demo Credentials

| Role | Email | Password | Quick Action |
|---|---|---|---|
| 👑 **Admin** | `admin@emptrack.com` | `admin123` | Click **Admin Demo** on Login Screen |
| 👤 **Employee** | `employee@emptrack.com` | `employee123` | Click **Employee Demo** on Login Screen |

---

## 🚀 Quick Start & Installation Guide

Follow these steps to run the application on your local machine:

### 1. Prerequisites
- **Node.js** (v16.0.0 or higher)
- **npm** or **yarn**
- **Git**

### 2. Clone the Repository
```bash
git clone https://github.com/bughunter-mano/employee-tracking-system.git
cd employee-tracking-system
```

### 3. Server (Backend) Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Configure environment variables (create .env file in server/)
```

Create a `.env` file in the `server/` directory with the following variables:
```env
PORT=5000
JWT_SECRET=mySuperSecretKey123
MONGODB_URI=mongodb://127.0.0.1:27017/employee_tracking
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional: Cloudinary configuration for image uploads
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start the backend development server:
```bash
npm run dev
```
*Backend will run on `http://localhost:5000`.*

### 4. Client (Frontend) Setup
Open a new terminal window:
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
*Frontend will run on `http://localhost:5173`.*

---

## 📁 Project Structure

```text
employee-tracking-system/
├── client/                     # React Frontend Application
│   ├── src/
│   │   ├── api/                # Axios instance & API config
│   │   ├── assets/             # Images & static assets
│   │   ├── components/         # Reusable components (Navbar, ProtectedRoute)
│   │   ├── pages/              # Login, AdminDashboard, EmployeeDashboard, ForgotPassword
│   │   ├── App.jsx             # React Router configuration
│   │   └── index.css           # Tailwind CSS & custom design tokens
│   └── package.json
│
└── server/                     # Express Backend Application
    ├── config/                 # Database connection & auto-seeding (db.js)
    ├── controllers/            # Auth, Admin, Employee, Score, Notification controllers
    ├── middleware/             # Auth & Role verification middleware
    ├── models/                 # Mongoose schemas (User, Attendance, Work, Notification, Score)
    ├── routes/                 # Express API routes
    ├── index.js                # Express app entry point
    └── package.json
```

---

## 📄 License
This project is open-source and available under the [ISC License](LICENSE).

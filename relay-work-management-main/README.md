# Relay Work Management
> A staff portal where managers track attendance, assign tasks and review daily work in one place.

![language](https://img.shields.io/badge/language-JavaScript-4338CA?style=flat-square&logo=javascript&logoColor=white) ![framework](https://img.shields.io/badge/framework-React_%2B_Express-4338CA?style=flat-square&logo=react&logoColor=white) ![license](https://img.shields.io/badge/license-MIT-6366F1?style=flat-square) ![status](https://img.shields.io/badge/status-complete-818CF8?style=flat-square)

## Overview
Relay gives a small team one place to run the working day. Managers see who has checked in, hand out tasks and review proof of work, while employees log attendance, submit their work and track their own performance score. It's built for agencies and small businesses that manage remote or hybrid staff.

## Features
- Admin dashboard with employee directory: add, edit and remove staff, and manually adjust performance scores
- Daily attendance check-in for employees, with a configurable check-in window and an admin "today" view
- Task assignment, so employees can see their assigned tasks and mark them as started
- Proof-of-work submissions with screenshot upload (Cloudinary), reviewed and scored by an admin
- In-app messaging between team members, plus admin broadcast notifications
- Secure login with JWT, email password reset, rate limiting, and a scheduled daily score check

## Tech Stack
| Layer | Technology | Version |
|---|---|---|
| Frontend | React | 19.2 |
| Frontend | Vite | 8.1 |
| Frontend | Tailwind CSS | 4.3 |
| Frontend | React Router | 7.18 |
| Frontend | Axios | 1.18 |
| Backend | Node.js + Express | 5.2 |
| Database | MongoDB + Mongoose | 9.9 |
| Auth | jsonwebtoken + bcrypt | 9.0 / 6.0 |
| Uploads | Multer + Cloudinary | 2.2 / 1.41 |
| Email | Nodemailer | 9.0 |
| Jobs | node-cron | 4.6 |
| Security | Helmet + express-rate-limit | 8.3 / 8.6 |

## Screenshots
<!-- Maria: add screenshots here -->

## Getting Started
**Prerequisites:** Node.js 18+, and MongoDB (local or Atlas). Optional: a Cloudinary account for screenshot uploads, and an SMTP/Gmail account for password-reset emails.

```bash
git clone https://github.com/mariaaitech-collab/relay-work-management.git
cd relay-work-management/relay-work-management-main

# Backend
cd server
cp .env.example .env      # then fill in MONGODB_URI, JWT_SECRET, MASTER_ADMIN_PASSWORD, etc.
npm install
npm run setup-admin       # creates the admin account
npm run dev               # http://localhost:5000

# Frontend (new terminal)
cd ../client
npm install
npm run dev               # http://localhost:5173
```

Set `VITE_API_URL` in the client if the API isn't on `http://localhost:5000/api`.

## Status
**Complete.** The admin and employee modules are all built.
Still to do: automated tests, and a new live deployment (the previous Vercel URL no longer resolves).

---
Built by Maria Shafqat · [Linktree](https://linktr.ee/mariashafqat_)

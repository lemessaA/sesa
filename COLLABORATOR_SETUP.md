# Collaborator Setup Guide

## Quick Start

Your collaborator can clone and run the project with these steps:

### 1. Clone the Repository
```bash
git clone https://github.com/Devloperameen/Devloperameen-SESA-ACADAMY.git
cd Devloperameen-SESA-ACADAMY
```

### 2. Install Dependencies
```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

### 3. Start MongoDB
```bash
mongod --dbpath /tmp/mongodb_data --fork
```

### 4. Seed Database (if needed)
```bash
cd backend && npm run seed && cd ..
```

### 5. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend && npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend && npm run dev
```

---

## Test Credentials

The database is already seeded with test accounts. Use these credentials to login:

### Admin
- **Email:** admin@sesa.com
- **Password:** admin123_Secure!

### Super Admin
- **Email:** superadmin@sesa.com
- **Password:** superadmin123_Secure!

### Instructor
- **Email:** instructor@sesa.com
- **Password:** instructor123_Secure!

### Assistant Instructor
- **Email:** assistant@sesa.com
- **Password:** assistant123_Secure!

### Students
- **Email:** student@sesa.com
- **Password:** student123_Secure!

- **Email:** premium@sesa.com
- **Password:** student123_Secure!

### Moderator
- **Email:** moderator@sesa.com
- **Password:** moderator123_Secure!

---

## Project Structure

```
├── backend/          # Express.js + MongoDB + TypeScript
├── frontend/         # React + Vite + TypeScript + Tailwind CSS
├── .env files        # Configuration (already set up)
└── package.json      # Root dependencies
```

## Troubleshooting

**MongoDB won't start?**
```bash
# Try with explicit path
mongod --dbpath ~/mongodb_data --fork
```

**Port already in use?**
- Backend runs on port 5000
- Frontend runs on port 5173
- MongoDB runs on port 27017

**Dependencies issues?**
```bash
# Clear and reinstall
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
```

---

Everything is ready to go! 🚀

# Ornave - Complete Setup Guide

This guide walks you through setting up the entire Ornave platform from scratch to running.

## 🎯 5-Minute Setup

If you're in a hurry, follow this:

```bash
# 1. Backend (Terminal 1)
cd backend
npm install
cp .env.example .env
# Edit .env and set DATABASE_URL
npx prisma migrate dev
npm run dev

# 2. Frontend (Terminal 2)
cd frontend
npm install
npm run dev

# 3. Open browser
# Go to http://localhost:5173
# Register → Create Company → Dashboard
```

---

## 📝 Detailed Setup Instructions

### Prerequisites

1. **Node.js 18+**
   ```bash
   node --version  # Should be v18+
   ```

2. **PostgreSQL 12+**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Mac: `brew install postgresql`
   - Linux: `sudo apt install postgresql`

3. **Git** (optional, for version control)

### Step 1: Backend Setup

#### 1.1 Install Dependencies
```bash
cd backend
npm install
```

Expected output: ~500 packages installed

#### 1.2 Configure Database
```bash
# Copy example environment file
cp .env.example .env

# Edit .env file
# Windows: notepad .env
# Mac/Linux: nano .env
```

**Edit these values in .env:**
```
DATABASE_URL=postgresql://postgres:password@localhost:5432/ornave
JWT_SECRET=your_super_secret_jwt_key_change_this
PORT=3000
NODE_ENV=development
```

#### 1.3 Create Database
```bash
# Run migrations to create tables
npx prisma migrate dev --name init

# This will:
# - Create ornave database
# - Create all 8 tables
# - Seed with sample data (optional)
```

#### 1.4 Start Backend Server
```bash
npm run dev
```

Expected output:
```
Server running on http://localhost:3000
Database connected
✅ Ready for requests
```

#### 1.5 Test Backend
```bash
# In another terminal, test the API
curl http://localhost:3000/api/health
# Should return: {"status":"ok"}
```

---

### Step 2: Frontend Setup

#### 2.1 Install Dependencies
```bash
cd frontend
npm install
```

Expected output: ~400 packages installed

#### 2.2 Configure Environment
```bash
# Copy example environment file
cp .env.example .env

# The .env is pre-configured for localhost:3000
# No changes needed unless backend is on different port
```

#### 2.3 Start Frontend Server
```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:5173/
➜  press h to show help
```

#### 2.4 Open in Browser
- Go to **http://localhost:5173**
- You should see the Ornave login page

---

## 🔐 First-Time Login

### Create Your Account

1. **Go to Registration**
   - URL: `http://localhost:5173/register`

2. **Fill in the form:**
   - First Name: `John`
   - Last Name: `Doe`
   - Email: `john@company.com`
   - Password: `SecurePass123!`
   - ✅ Click Register

3. **Create Your Company**
   - Company Name: `My First Company`
   - Slug: `my-first-company`
   - ✅ Click Create

4. **You're In!**
   - Dashboard shows all features
   - Try creating a module
   - Try sending a connection request

---

## 🛠️ Development Commands

### Backend

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript |
| `npm start` | Start production server |
| `npx prisma studio` | Open database GUI |
| `npx prisma migrate dev` | Create new migration |
| `npm run test` | Run tests (when available) |

### Frontend

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Check code quality |
| `npm run type-check` | Check TypeScript types |

---

## 🧪 Testing the Full Flow

### 1. Test Authentication
```
1. Go to /register
2. Create account with valid credentials
3. Should redirect to company setup
4. Go back and login - should work
5. Logout - should clear session
```

### 2. Test Company Features
```
1. Dashboard → Company Settings
2. Update company name
3. Dashboard → Modules
4. Create new module "Sales"
5. Edit/Delete module
```

### 3. Test Connections
```
1. (In two browser windows)
2. Company A: Dashboard → Connections
3. Company B: Create account
4. Company A: Send connection request to B
5. Company B: View incoming, accept
6. Both see "Active connection"
```

### 4. Test Transactions
```
1. Dashboard → Transactions
2. No transactions initially
3. When companies connected, can send
4. View received transactions
5. Update status
```

---

## 📊 Database

### View Data with Prisma Studio
```bash
cd backend
npx prisma studio
```

Opens GUI at `http://localhost:5555`

### Reset Database (Start Over)
```bash
cd backend
npx prisma migrate reset
# Confirms: yes
# Database reset and migrations rerun
```

### Database Schema

```sql
-- 8 Main Tables
- Users           -- Registered users
- Companies       -- Company accounts  
- Modules         -- ERP modules
- Pages           -- Custom pages
- Connections     -- Company connections
- Transactions    -- Financial transactions
- Messages        -- Communications
- AuditLogs       -- Activity tracking
```

---

## 🔒 Security Configuration

### Backend Security

1. **JWT Secret** - Change in `.env`
   ```
   JWT_SECRET=your_very_long_random_string_here
   ```

2. **CORS** - Already configured for localhost
   - For production, update in `backend/src/app.ts`

3. **Password Hashing** - Using bcrypt (automatic)

4. **Database Security**
   - Prepared statements via Prisma
   - SQL injection prevention automatic

### Frontend Security

1. **Token Storage** - localStorage (localStorageisecure for tokens in production apps)
   - Auto-cleared on 401

2. **HTTPS** - Configure for production
   - Vite has HTTPS guide in docs

3. **CORS** - Handled by backend

---

## 🚀 Production Deployment

### Backend Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Set Environment**
   ```bash
   export DATABASE_URL=postgres://prod_db
   export JWT_SECRET=very_long_secret
   export NODE_ENV=production
   ```

3. **Run**
   ```bash
   npm start
   ```

### Frontend Deployment

1. **Build**
   ```bash
   npm run build
   ```

2. **Deploy `dist/` to:**
   - Vercel
   - Netlify
   - AWS S3
   - GitHub Pages
   - Or any static host

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to database"
```bash
# Check PostgreSQL is running
# Windows: Services → PostgreSQL
# Mac: brew services list | grep postgres
# Linux: sudo systemctl status postgresql

# Check connection string in .env
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/ornave
```

### Issue: Port 3000 already in use
```bash
# Kill process using port 3000
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000 | kill -9 PID

# Or use different port in .env
PORT=3001
```

### Issue: Port 5173 already in use
```bash
# Frontend will use next available port
# Or specify in vite.config.ts
```

### Issue: npm install fails
```bash
# Clear cache and retry
npm cache clean --force
npm install

# Or use yarn
yarn install
```

### Issue: TypeScript errors
```bash
# Rebuild TypeScript
npm run build

# Check tsconfig.json is correct
```

---

## 📚 API Examples

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Profile (with token)
```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📁 Important Files

### Backend
- `backend/.env` - Database and secrets
- `backend/src/app.ts` - Express app setup
- `backend/prisma/schema.prisma` - Database schema
- `backend/package.json` - Dependencies

### Frontend
- `frontend/.env` - API URL
- `frontend/src/App.tsx` - Main component
- `frontend/src/services/api.ts` - API client
- `frontend/src/context/AuthContext.tsx` - Auth state
- `frontend/package.json` - Dependencies

---

## ✅ Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Node.js version 18+
- [ ] Backend dependencies installed
- [ ] Frontend dependencies installed
- [ ] Backend `.env` configured
- [ ] Database migrations ran
- [ ] Backend server running (http://localhost:3000)
- [ ] Frontend server running (http://localhost:5173)
- [ ] Can register account
- [ ] Can login
- [ ] Can create company
- [ ] Dashboard loads
- [ ] Can create module
- [ ] Can navigate pages

---

## 🎓 Learning Path

1. **Understand the Structure** - Read this file
2. **Set Up Locally** - Follow setup steps
3. **Create Test Account** - Register and explore
4. **Read API Docs** - Check backend routes
5. **Explore Code** - Look at components
6. **Make Changes** - Try modifying something
7. **Deploy** - Follow production setup

---

## 🆘 Getting Help

1. **Check Error Messages** - Usually tells you what's wrong
2. **Check Logs** - Terminal output is detailed
3. **Check Browser Console** - F12 → Console tab
4. **Read README** - Top-level overview
5. **Check Code Comments** - Well documented

---

## 📞 Next Steps

- **Production**: See deployment section
- **Customization**: Modify components and pages
- **Testing**: Add unit tests
- **Documentation**: API docs with Swagger
- **Scaling**: Add caching, queuing, etc.

---

**Status**: All systems ready for development and deployment ✅

**Happy coding! 🚀**

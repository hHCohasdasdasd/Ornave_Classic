# 🚀 Ornave - Quick Setup Card

## Status: Dependencies Fixed ✅

Your Node.js dependencies are now fixed and ready!

## ⚠️ Waiting For: PostgreSQL Database

PostgreSQL is required but not currently running.

---

## 📦 What's Ready

✅ Backend dependencies installed
✅ TypeScript compiler configured  
✅ Prisma ORM ready
✅ All services scaffolded
✅ Frontend dependencies ready

---

## 🐘 What's Needed: PostgreSQL

**3 Options:**

### Option A: Quick Install (5 min)
1. Download from: https://www.postgresql.org/download/windows/
2. Run installer (keep default settings)
3. Create database: `psql -U postgres -c "CREATE DATABASE ornave_db;"`
4. Update `backend/.env` with your password

### Option B: Already Installed?
```powershell
# Check if running
psql -U postgres -c "SELECT 1"

# If not running, start service:
sc start PostgreSQL15
# Or use Services (Win+R → services.msc)
```

### Option C: Docker (If Available Later)
```bash
docker run --name ornave-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ornave_db \
  -p 5432:5432 -d postgres:15
```

---

## 🎯 Next Steps (Once PostgreSQL is Running)

**Terminal 1 (Backend):**
```bash
cd backend
npx prisma migrate dev --name init
npm run dev
# Server runs on http://localhost:3000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
# App runs on http://localhost:5173
```

**Then:**
- Go to http://localhost:5173
- Register → Create Company → Start Using!

---

## 📝 .env Configuration

**File**: `backend/.env`

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/ornave_db"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV="development"
```

Replace `PASSWORD` with your PostgreSQL password.

---

## ✅ Verification Checklist

- [ ] PostgreSQL downloaded and installed
- [ ] PostgreSQL service is running
- [ ] Database `ornave_db` created
- [ ] `.env` file updated with credentials
- [ ] Can run: `npm run dev` without errors

---

## 🎓 Full Details

For complete setup guide: See `DATABASE_SETUP.md`

For project overview: See `SETUP.md` or `START_HERE.md`

---

**The backend is ready. Just need PostgreSQL running!**

Questions? Check `DATABASE_SETUP.md` for troubleshooting.

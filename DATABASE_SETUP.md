# Ornave Backend - Database Setup Guide

## ⚠️ Current Issue
PostgreSQL is not running at `localhost:5432`. We need to set it up before continuing.

---

## 🐘 Option 1: Install PostgreSQL (Recommended)

### Step 1: Download PostgreSQL
1. Go to: https://www.postgresql.org/download/windows/
2. Download the Windows installer (version 15 or higher recommended)
3. Run the installer

### Step 2: During Installation
- **Installation Directory**: `C:\Program Files\PostgreSQL\15` (or your preferred location)
- **Port**: Keep as `5432`
- **Username**: `postgres`
- **Password**: `password` (or your preference)
- **Locale**: Your system locale

### Step 3: Complete Installation
- Check "Launch Stack Builder" at the end (optional)
- PostgreSQL service will start automatically

### Step 4: Create the Database
```bash
# Open Command Prompt or PowerShell
psql -U postgres

# In psql prompt, create the database:
CREATE DATABASE ornave_db;
\q
```

### Step 5: Update .env
Edit `backend/.env`:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/ornave_db"
```

---

## 🐳 Option 2: Use Docker (If Available)

If you install Docker Desktop later:
```bash
docker run --name ornave-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=ornave_db \
  -p 5432:5432 \
  -d postgres:15
```

---

## ✅ Verify PostgreSQL is Running

### Windows - Check Services
1. Press `Win + R`
2. Type `services.msc`
3. Look for **PostgreSQL**
4. If stopped, right-click → **Start**

### Command Line Check
```powershell
# Test connection
psql -U postgres -h localhost -d postgres -c "SELECT 1"

# If successful, you'll see:
# ?column?
# ----------
#        1
```

---

## 🚀 Once PostgreSQL is Running

In the `backend` directory, run:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init

# Start the backend server
npm run dev
```

The backend will start on `http://localhost:3000`

---

## 📝 What Next?

1. **Install PostgreSQL** using Option 1 above
2. **Verify it's running** using the verification steps
3. **Update .env** with your credentials
4. **Run the setup commands** above
5. **Start the backend**: `npm run dev`
6. **Start the frontend** (in another terminal):
   ```bash
   cd frontend
   npm run dev
   ```

---

## 🆘 Troubleshooting

### "Can't reach database server at localhost:5432"
✅ PostgreSQL isn't running
- Open Services (Win+R → services.msc)
- Find PostgreSQL → Start

### "password authentication failed"
✅ Wrong password in .env
- Update DATABASE_URL with correct password
- Or reset PostgreSQL password (see pgAdmin)

### "database ornave_db does not exist"
✅ Database wasn't created
- Run: `psql -U postgres -c "CREATE DATABASE ornave_db;"`

### Port 5432 is already in use
✅ Different PostgreSQL version already running
- Change port in .env to `5433` or stop other instance

---

## 📞 Need Help?

1. Verify PostgreSQL is installed: `psql --version`
2. Verify it's running: `psql -U postgres -c "SELECT 1"`
3. Check .env has correct DATABASE_URL
4. Try creating database manually with pgAdmin

---

**Status**: Waiting for PostgreSQL setup
**Next Step**: Install PostgreSQL and run migrations

Let me know once PostgreSQL is installed and running!

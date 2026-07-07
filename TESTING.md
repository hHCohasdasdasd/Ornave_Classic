# API Testing & Quick Start Guide

## 🚀 Getting Started

### 1. Prerequisites
- Node.js v18+
- PostgreSQL 12+
- Postman or curl
- Git

### 2. Initial Setup

```bash
# Clone and navigate
cd backend

# Install dependencies
npm install

# Setup environment
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# DATABASE_URL="postgresql://user:password@localhost:5432/ornave_db"

# Initialize database
npm run prisma:generate
npm run prisma:migrate

# Start server
npm run dev
```

Server runs on `http://localhost:3000`

## 📡 Testing Workflow

### Step 1: Create a Company

```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "description": "Leading manufacturing company"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Company created successfully",
  "data": {
    "id": "clv1abc123...",
    "name": "Acme Corporation",
    "slug": "acme-corp",
    "companyToken": "orn_abc123xyz789",
    "isPremium": false,
    "isActive": true,
    "createdAt": "2024-02-16T10:30:00Z"
  },
  "timestamp": "2024-02-16T10:30:00Z"
}
```

**Save the following for next steps:**
- `id` → Company ID
- `companyToken` → API token for company

### Step 2: Register First User (Owner)

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@acme.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "companyId": "clv1abc123..."
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user_123",
      "email": "owner@acme.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "OWNER",
      "companyId": "clv1abc123..."
    }
  },
  "timestamp": "2024-02-16T10:30:00Z"
}
```

**Save the token - use for all protected endpoints**

### Step 3: Verify Default Modules Created

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../modules \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response:** Array of 6 default modules (Dashboard, Inventory, Sales, etc.)

## 📝 Complete API Testing Examples

### Authentication

#### Register New Employee

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "employee@acme.com",
    "password": "EmpPass456!",
    "firstName": "Jane",
    "lastName": "Smith",
    "companyId": "clv1abc123..."
  }'
```

#### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "owner@acme.com",
    "password": "SecurePass123!"
  }'
```

#### Get Profile

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Change Password

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "oldPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
  }'
```

### Company Management

#### Get Company Details

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123... \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Get Company by Slug (Public)

```bash
curl -X GET http://localhost:3000/api/companies/slug/acme-corp
```

#### Get All Company Users

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../users \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Update Company Settings

```bash
curl -X PUT http://localhost:3000/api/companies/clv1abc123.../settings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "theme": "dark",
    "customConfig": {
      "timezone": "America/New_York",
      "language": "en",
      "dateFormat": "MM/DD/YYYY"
    }
  }'
```

#### Regenerate Company Token (Owner Only)

```bash
curl -X POST http://localhost:3000/api/companies/clv1abc123.../regenerate-token \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Module Management

#### Get All Modules

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../modules \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Get Enabled Modules Only

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../modules/enabled \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Create Custom Module

```bash
curl -X POST http://localhost:3000/api/companies/clv1abc123.../modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "Quality Control",
    "slug": "quality-control",
    "description": "Quality assurance and testing",
    "icon": "check-circle"
  }'
```

#### Update Module

```bash
curl -X PUT http://localhost:3000/api/companies/clv1abc123.../modules/mod_123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "name": "QC & Compliance",
    "description": "Updated description",
    "isEnabled": true
  }'
```

#### Toggle Module Visibility

```bash
curl -X PATCH http://localhost:3000/api/companies/clv1abc123.../modules/mod_123/visibility \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Reorder Modules

```bash
curl -X POST http://localhost:3000/api/companies/clv1abc123.../modules/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "moduleIds": [
      "mod_dashboard",
      "mod_sales",
      "mod_quality_control",
      "mod_inventory",
      "mod_purchasing",
      "mod_accounting",
      "mod_reports"
    ]
  }'
```

#### Delete Module

```bash
curl -X DELETE http://localhost:3000/api/companies/clv1abc123.../modules/mod_123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Page Management

#### Create Page

```bash
curl -X POST http://localhost:3000/api/companies/clv1abc123.../pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "title": "Sales Dashboard",
    "slug": "sales-dashboard",
    "description": "Company-wide sales metrics",
    "icon": "chart-bar",
    "layout": {
      "type": "container",
      "orientation": "grid",
      "gridColumns": 12,
      "components": [
        {
          "id": "widget_1",
          "type": "card",
          "props": {
            "title": "Total Revenue",
            "value": "$1.2M"
          },
          "gridArea": "1 / 1 / 2 / 4"
        }
      ]
    }
  }'
```

#### Get All Pages

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../pages \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Get Published Pages (Public)

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../pages/published
```

#### Get Page by Slug (Public)

```bash
curl -X GET http://localhost:3000/api/companies/clv1abc123.../pages/slug/sales-dashboard
```

#### Update Page Layout

```bash
curl -X PATCH http://localhost:3000/api/companies/clv1abc123.../pages/page_123/layout \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "layout": {
      "type": "container",
      "components": [
        {
          "id": "widget_2",
          "type": "chart",
          "props": {
            "chartType": "line",
            "title": "Revenue Trend"
          }
        }
      ]
    }
  }'
```

#### Publish Page

```bash
curl -X PATCH http://localhost:3000/api/companies/clv1abc123.../pages/page_123/publish \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Reorder Pages

```bash
curl -X POST http://localhost:3000/api/companies/clv1abc123.../pages/reorder \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -d '{
    "pageIds": ["page_dashboard", "page_reports", "page_settings"]
  }'
```

#### Delete Page

```bash
curl -X DELETE http://localhost:3000/api/companies/clv1abc123.../pages/page_123 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## 🧪 Postman Collection Setup

### Import Environment

```json
{
  "name": "Ornave Development",
  "values": [
    {
      "key": "base_url",
      "value": "http://localhost:3000",
      "enabled": true
    },
    {
      "key": "company_id",
      "value": "clv1abc123...",
      "enabled": true
    },
    {
      "key": "auth_token",
      "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "enabled": true
    }
  ]
}
```

### Use in Requests

```
Authorization: Bearer {{auth_token}}
GET {{base_url}}/api/companies/{{company_id}}/modules
```

## ✅ Common Issues & Debugging

### 1. Database Connection Failed

```bash
# Check PostgreSQL is running
psql -U postgres -d postgres

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Retry migration
npm run prisma:migrate
```

### 2. Port Already in Use

```bash
# Kill process on port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3000
kill -9 <PID>
```

### 3. JWT Token Expired

- Tokens expire after 7 days (configurable in .env)
- Login again to get a new token

### 4. Company Not Found

- Make sure `companyId` matches exactly
- Check company exists: `GET /api/companies/slug/{slug}`

### 5. Unauthorized / Forbidden

- Verify token is in Authorization header: `Bearer {token}`
- Ensure user belongs to the company (`companyId` match)
- Check user role has permission

## 🔍 Database Inspection

### Using Prisma Studio

```bash
npm run prisma:studio

# Opens UI at http://localhost:5555
# Browse all tables, create, edit, delete records
```

### SQL Queries

```sql
-- View all companies
SELECT id, name, slug, "isActive" FROM "Company";

-- View all users
SELECT id, email, role, "companyId" FROM "User";

-- View modules for company
SELECT id, name, slug, "displayOrder", "isEnabled" 
FROM "Module" 
WHERE "companyId" = 'clv1abc123...';
```

## 📊 Performance Testing

### Load Testing with Apache Bench

```bash
# Install: apt-get install apache2-utils (Linux) or brew install httpd (Mac)

# Test endpoint (1000 requests, 10 concurrent)
ab -n 1000 -c 10 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  http://localhost:3000/api/companies/clv1abc123.../modules
```

---

**Next Steps:**
1. Set up database
2. Start server
3. Run through testing workflow
4. Build frontend integration
5. Deploy to production

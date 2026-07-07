# Quick Reference Guide - Ornave Platform

## 🚀 Quick Start (5 minutes)

```bash
# 1. Setup backend
cd backend
npm install
cp .env.example .env

# Edit .env with PostgreSQL connection
# DATABASE_URL="postgresql://user:pass@localhost:5432/ornave"

# 2. Initialize database
npm run prisma:generate
npm run prisma:migrate

# 3. Start server
npm run dev
# Server runs on http://localhost:3000
```

---

## 📚 File Reference

### Controllers (Handle HTTP Requests)
| File | Purpose | Endpoints |
|------|---------|-----------|
| `authController.ts` | Login, register, password | 5 endpoints |
| `companyController.ts` | Company CRUD, settings | 7 endpoints |
| `moduleController.ts` | Module CRUD, reorder | 8 endpoints |
| `pageController.ts` | Page CRUD, layout builder | 10 endpoints |

### Services (Business Logic)
| File | Purpose | Methods |
|------|---------|---------|
| `authService.ts` | User auth, token mgmt | register, login, getUserById |
| `companyService.ts` | Company operations | createCompany, updateSettings |
| `moduleService.ts` | Module management | createModule, reorderModules |
| `pageService.ts` | Page builder ops | createPage, updatePageLayout |

### Middleware (Request Processing)
| File | Purpose | Checks |
|------|---------|--------|
| `auth.ts` | JWT verification, roles | Token validity, role permissions |
| `errorHandler.ts` | Error catching | Validation, database, async |

### Utilities (Helper Functions)
| File | Purpose | Use Cases |
|------|---------|-----------|
| `tokenManager.ts` | JWT operations | Create/verify tokens |
| `passwordManager.ts` | Password hashing | Hash/verify passwords |
| `generators.ts` | ID generation | Slugs, tokens, references |
| `apiResponse.ts` | Response formatting | Success/error responses |

### Database (Prisma)
| File | Purpose | Tables |
|------|---------|--------|
| `schema.prisma` | Database schema | 8 models, relationships |

---

## 🔄 Common Workflows

### Create New Company Workflow

```typescript
// 1. User calls API
POST /api/companies
{ "name": "Acme Corp", "slug": "acme" }

// 2. Controller receives & validates
const validated = CreateCompanySchema.parse(req.body);

// 3. Service creates company
const company = await CompanyService.createCompany(validated);

// 4. Default modules auto-created
await ModuleService.initializeDefaultModules(company.id);

// 5. Response sent
{
  id: "...",
  companyToken: "orn_...",
  modules: [...]
}
```

### User Registration Workflow

```typescript
// 1. API receives registration
POST /api/auth/register
{ email, password, firstName, lastName, companyId }

// 2. Controller validates input
CreateRegisterSchema.parse(req.body);

// 3. Service creates user
- Hash password with bcrypt
- First user → OWNER role
- Later users → EMPLOYEE role

// 4. JWT token generated
const token = TokenManager.generateToken({
  userId, email, companyId, role
});

// 5. Return token to client
{ token, user }
```

### Module Reorder Workflow

```typescript
// 1. API receives module IDs in new order
POST /api/companies/{companyId}/modules/reorder
{ moduleIds: ["mod1", "mod3", "mod2"] }

// 2. Service validates all modules belong to company
// 3. Updates displayOrder for each module
// 4. Updates CompanySettings.moduleOrder
// 5. Return success

// Frontend re-renders modules in new order
```

---

## 🔑 Authentication Flow

### Bearer Token Usage

```bash
# Include in every protected request
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Example
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/api/companies/{id}/modules
```

### Token Structure

```typescript
interface JwtPayload {
  userId: string;       // User ID
  email: string;        // User email
  companyId: string;    // Company ID (multi-tenant)
  role: string;         // OWNER | ADMIN | EMPLOYEE
  iat: number;          // Issued at
  exp: number;          // Expiration
}
```

### Token Expiration

- Default: **7 days** (set in `.env` as `JWT_EXPIRY`)
- When expired: Re-login to get new token
- Validation: `TokenManager.verifyToken(token)`

---

## 🗄️ Database Schema Quick View

### User
```
id, email, password, firstName, lastName
role (OWNER|ADMIN|EMPLOYEE)
companyId, isActive, lastLogin
```

### Company
```
id, name, slug (unique), companyToken (unique)
isActive, isPremium
createdAt, updatedAt
```

### CompanySettings
```
companyId (unique)
moduleOrder: string[]
pageOrder: string[]
theme: light|dark
customConfig: JSON
```

### Module
```
id, companyId, name, slug
description, icon
isEnabled, displayOrder
config: JSON
```

### Page
```
id, companyId, title, slug
layout: JSON (component tree)
isPublished, displayOrder
metadata: JSON
```

---

## 🔐 Security Checklist

- [x] JWT token required for protected endpoints
- [x] Company context validated (user belongs to company)
- [x] Role-based access enforced
- [x] Passwords hashed with bcrypt (10 rounds)
- [x] Input validated with Zod schemas
- [x] Helmet security headers enabled
- [x] CORS configured
- [x] SQL injection prevented (Prisma)

---

## 🐛 Debugging Tips

### Check Token Validity
```typescript
const decoded = TokenManager.verifyToken(token);
if (!decoded) console.log('Token expired or invalid');
```

### Verify Company Access
```typescript
if (req.user?.companyId !== requestedCompanyId) {
  console.log('User not allowed to access this company');
}
```

### Database Connection
```bash
# Test PostgreSQL connection
psql -U user -d ornave_db -c "SELECT 1;"

# View all tables
npm run prisma:studio
# Opens http://localhost:5555
```

### Enable Request Logging
```typescript
// Already in index.ts
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});
```

---

## 📝 API Pattern Reference

### Create Resource
```bash
POST /api/companies/{companyId}/modules
{
  "name": "Quality Control",
  "slug": "quality-control"
}
# Returns: 201 with created resource
```

### Get Multiple
```bash
GET /api/companies/{companyId}/modules
# Returns: 200 with array
```

### Get Single
```bash
GET /api/companies/{companyId}/modules/{moduleId}
# Returns: 200 with resource
```

### Update Resource
```bash
PUT /api/companies/{companyId}/modules/{moduleId}
{ "name": "New Name" }
# Returns: 200 with updated resource
```

### Partial Update
```bash
PATCH /api/companies/{companyId}/modules/{moduleId}/visibility
# Returns: 200 with updated resource
```

### Delete Resource
```bash
DELETE /api/companies/{companyId}/modules/{moduleId}
# Returns: 200 with null data
```

### Batch Operation
```bash
POST /api/companies/{companyId}/modules/reorder
{ "moduleIds": ["id1", "id2", "id3"] }
# Returns: 200 with null data
```

---

## 🎯 Validation Rules

### Email
- Must be valid email format
- Must be unique across system

### Password
- Minimum 8 characters
- Must have: uppercase, lowercase, number, special char
- Example: `SecurePass123!`

### Company Slug
- Lowercase letters, numbers, hyphens only
- No spaces or special characters
- Unique across system

### Module/Page Slug
- Unique within company
- Lowercase letters, numbers, hyphens only

---

## 🚦 HTTP Status Codes Used

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | GET, PUT, PATCH, DELETE |
| 201 | Created | POST (successful creation) |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | No permission / wrong company |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

---

## 🔄 Error Response Format

```json
{
  "success": false,
  "message": "User-friendly error message",
  "error": "Technical error details",
  "timestamp": "2024-02-16T10:30:00Z"
}
```

---

## 📊 Database Indexes

```sql
-- User queries
CREATE INDEX idx_user_company ON "User"("companyId");
CREATE INDEX idx_user_email ON "User"("email");

-- Module queries
CREATE INDEX idx_module_company ON "Module"("companyId");
CREATE INDEX idx_module_display ON "Module"("displayOrder");

-- Page queries
CREATE INDEX idx_page_company ON "Page"("companyId");
CREATE INDEX idx_page_display ON "Page"("displayOrder");

-- Connection queries
CREATE INDEX idx_connection_from ON "CompanyConnection"("fromCompanyId");
CREATE INDEX idx_connection_status ON "CompanyConnection"("status");
```

---

## 🔧 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/ornave

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRY=7d

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

---

## 📞 API Endpoints Summary

### Auth (5 endpoints)
- POST `/api/auth/register`
- POST `/api/auth/login`
- GET `/api/auth/profile`
- POST `/api/auth/change-password`
- GET `/api/auth/verify`

### Companies (7 endpoints)
- POST `/api/companies`
- GET `/api/companies/slug/:slug`
- GET `/api/companies/:id`
- PUT `/api/companies/:id/settings`
- GET `/api/companies/:id/users`
- POST `/api/companies/:id/regenerate-token`
- DELETE `/api/companies/:id`

### Modules (8 endpoints)
- GET `/api/companies/:companyId/modules`
- GET `/api/companies/:companyId/modules/enabled`
- POST `/api/companies/:companyId/modules`
- GET `/api/companies/:companyId/modules/:id`
- PUT `/api/companies/:companyId/modules/:id`
- PATCH `/api/companies/:companyId/modules/:id/visibility`
- POST `/api/companies/:companyId/modules/reorder`
- DELETE `/api/companies/:companyId/modules/:id`

### Pages (10 endpoints)
- GET `/api/companies/:companyId/pages`
- POST `/api/companies/:companyId/pages`
- GET `/api/companies/:companyId/pages/published`
- GET `/api/companies/:companyId/pages/slug/:slug`
- GET `/api/companies/:companyId/pages/:id`
- PUT `/api/companies/:companyId/pages/:id`
- PATCH `/api/companies/:companyId/pages/:id/layout`
- PATCH `/api/companies/:companyId/pages/:id/publish`
- POST `/api/companies/:companyId/pages/reorder`
- DELETE `/api/companies/:companyId/pages/:id`

---

## 💡 Pro Tips

1. **Always include `companyId` in URLs** - Ensures multi-tenant isolation
2. **Test with Postman** - Save environment variables for reuse
3. **Check token in headers** - Use `Authorization: Bearer TOKEN`
4. **Monitor logs** - Check console for request details
5. **Use Prisma Studio** - Run `npm run prisma:studio` for data inspection
6. **Validate on frontend too** - Don't rely only on backend validation
7. **Handle token expiration** - Refresh token on 401 response
8. **Test error cases** - Invalid inputs, missing fields, wrong company
9. **Document API changes** - Update TESTING.md when adding endpoints
10. **Use meaningful slugs** - Easier for UI navigation

---

**For detailed information, see: README.md, ARCHITECTURE.md, TESTING.md**

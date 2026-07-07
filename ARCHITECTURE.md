# Ornave Architecture Documentation

## 📐 System Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
│              React Components + Page Builder UI              │
└────────────────────────┬────────────────────────────────────┘
                         │
                    HTTP/REST API
                         │
┌────────────────────────┴────────────────────────────────────┐
│                    Express Backend                           │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Controllers  │ Services     │ Middleware   │ Routes         │
├──────────────┼──────────────┼──────────────┼────────────────┤
│ Auth         │ AuthService  │ authMiddle   │ /api/auth      │
│ Company      │ CompanyServ  │ errorHandle  │ /api/companies │
│ Module       │ ModuleServ   │ CORS, Helmet │ /api/modules   │
│ Page         │ PageService  │ Logger       │ /api/pages     │
└──────────────┴──────────────┴──────────────┴────────────────┘
                         │
                 Prisma ORM Layer
                         │
┌────────────────────────┴────────────────────────────────────┐
│                   PostgreSQL Database                        │
│         (Multi-Tenant with Company Isolation)               │
└─────────────────────────────────────────────────────────────┘
```

## 🔒 Multi-Tenancy Architecture

### Database Isolation Pattern

Every table includes `companyId` foreign key:

```typescript
model User {
  id        String
  email     String
  companyId String  // ← Multi-tenant partition key
  company   Company @relation(fields: [companyId], references: [id])
  @@index([companyId])
}
```

### Query Filtering

All queries automatically filtered by company:

```typescript
// Get modules for specific company only
const modules = await prisma.module.findMany({
  where: { companyId: "company_123" }  // ← Always included
});
```

### Middleware Enforcement

```typescript
// companyContextMiddleware ensures user can only access their company
if (req.user.companyId !== requestedCompanyId) {
  // Deny access
}
```

## 🏗️ Service Layer Architecture

### Three-Tier Architecture

```
Request
   ↓
┌──────────────────────┐
│ Controller           │ ← Handles HTTP, validation, response format
├──────────────────────┤
│ Service              │ ← Business logic, data transformation
├──────────────────────┤
│ Database (Prisma)    │ ← Data persistence
└──────────────────────┘
   ↓
Response
```

### Example: Module Creation Flow

```typescript
// 1. Controller receives request
POST /api/companies/{companyId}/modules
{
  "name": "Quality Control",
  "slug": "quality-control"
}

// 2. Controller validates input (Zod schema)
const validated = CreateModuleSchema.parse(req.body);

// 3. Controller calls service layer
const module = await ModuleService.createModule(companyId, validated);

// 4. Service layer implements business logic
// - Generates slug
// - Checks for duplicates
// - Creates module record
// - Updates company settings
// - Returns formatted response

// 5. Response sent to client
{
  "success": true,
  "data": {
    "id": "mod_123",
    "name": "Quality Control",
    "slug": "quality-control",
    "displayOrder": 6
  }
}
```

## 📦 Module System Design

### Dynamic Module Engine

Each company can:
1. **Enable/Disable** modules without deletion
2. **Rename** modules for custom terminology
3. **Reorder** modules to customize UI layout
4. **Add Custom** modules
5. **Configure** module settings via JSON

### Module Order Persistence

```typescript
// CompanySettings stores module order
{
  moduleOrder: ["dashboard_id", "sales_id", "inventory_id"],
  pageOrder: ["home_id", "reports_id"]
}
```

### Default Modules Initialization

```typescript
const DEFAULT_MODULES = [
  { name: 'Dashboard', slug: 'dashboard', order: 0 },
  { name: 'Inventory', slug: 'inventory', order: 1 },
  { name: 'Sales', slug: 'sales', order: 2 },
  { name: 'Purchasing', slug: 'purchasing', order: 3 },
  { name: 'Accounting', slug: 'accounting', order: 4 },
  { name: 'Reports', slug: 'reports', order: 5 },
];
```

## 🎨 Page Builder Architecture

### Layout Configuration Storage

Pages store complete UI structure as JSON:

```typescript
{
  id: "page_123",
  title: "Custom Dashboard",
  layout: {
    type: "container",
    orientation: "grid",
    gridColumns: 12,
    components: [
      {
        id: "widget_1",
        type: "chart",
        props: {
          chartType: "bar",
          dataSource: "sales_api"
        },
        gridArea: "1 / 1 / 3 / 7"
      },
      {
        id: "widget_2",
        type: "card",
        props: {
          title: "Total Revenue"
        },
        gridArea: "1 / 7 / 2 / 13"
      }
    ]
  }
}
```

### Component Tree Rendering

Frontend renders layout dynamically:

```typescript
// Frontend component
function PageRenderer({ page }) {
  return renderComponents(page.layout);
}

// Recursively renders component tree
function renderComponents(layout) {
  return layout.components.map(component => {
    const Component = componentRegistry[component.type];
    return <Component key={component.id} config={component.props} />;
  });
}
```

## 🔑 Authentication & Authorization

### JWT Token Structure

```typescript
{
  userId: "user_123",
  email: "john@acme.com",
  companyId: "company_456",
  role: "ADMIN",
  iat: 1708082400,
  exp: 1708687200
}
```

### Role-Based Access Control

```typescript
// Different endpoints require different roles
router.post(
  '/:companyId/users',
  authMiddleware,              // ← Require authentication
  roleMiddleware('OWNER', 'ADMIN'),  // ← Require role
  CompanyController.inviteUser
);
```

### Role Permissions

| Role | Permissions |
|------|-------------|
| **OWNER** | Full company access, delete company, manage admins, regenerate token |
| **ADMIN** | Manage modules, pages, users (non-admin), company settings |
| **EMPLOYEE** | View enabled modules, access assigned pages, limited operations |

## 🌐 Network Communication Layer (Phase 2)

### Company Connections Workflow

```
Company A                   Company B
   │                            │
   └──────────────────────────────┘
         Request Connection
            ↓
        PENDING state
            ↓
      User Reviews
            ↓
        ACCEPTED/REJECTED
```

### Transaction Flow

```
Company A              Company B
  ├─ Create Order
  │  └─ Transaction created (PENDING)
  │
  └─► Send to Company B
      │
      └─► Company B receives
          └─ Transaction in inbox
          │
          └─ Review & Accept
             └─ Status: ACCEPTED
             │
             └─ Sync back to Company A
```

## 🗄️ Data Modeling Decisions

### Why NoSQL-style Config in SQL Database?

```typescript
// Custom configuration stored as JSON
settings: {
  timezone: "UTC",
  language: "en",
  customFields: {
    "invoice_prefix": "INV",
    "order_prefix": "ORD"
  }
}
```

**Benefits:**
- Flexibility without schema migrations
- Per-company customization
- Extensible for future features
- SQL database reliability

### Soft Deletes vs Hard Deletes

Current implementation uses **hard deletes** for simplicity. For production, consider:

```typescript
// Add deletedAt field for soft deletes
model Module {
  id        String
  deletedAt DateTime?  // null = active, timestamp = deleted
}

// Filter deleted records in queries
where: {
  companyId: id,
  deletedAt: null  // Exclude deleted
}
```

## 🚀 Scalability Considerations

### Prepared for Horizontal Scaling

1. **Stateless Services** - No in-memory state
2. **Database-Backed Sessions** - (Can add later)
3. **API Design** - Each request self-contained
4. **Multi-Tenancy** - Easy to distribute companies across instances

### Ready for Microservices Migration

```
Current (Monolith)
    ↓
api_gateway/
  ├─ auth-service (extract later)
  ├─ company-service
  ├─ module-service
  ├─ page-service
  ├─ transaction-service
  └─ messaging-service
```

### Database Optimization

For millions of companies:

```sql
-- Indexes on frequently queried fields
CREATE INDEX idx_user_company ON "User"("companyId");
CREATE INDEX idx_module_company ON "Module"("companyId");
CREATE INDEX idx_connection_status ON "CompanyConnection"("status");

-- Partition large tables by companyId (future)
PARTITION BY LIST (companyId)
```

## 🔄 API Design Patterns

### RESTful Resource URLs

```
/api/companies                    # Company collection
/api/companies/{id}               # Company detail
/api/companies/{id}/modules       # Company's modules
/api/companies/{id}/modules/{mid} # Specific module
```

### Standard HTTP Methods

```
GET    /resource        # List resources
POST   /resource        # Create resource
GET    /resource/{id}   # Get resource detail
PUT    /resource/{id}   # Update resource
PATCH  /resource/{id}   # Partial update
DELETE /resource/{id}   # Delete resource
```

### Special Operations

```
POST   /resource/reorder       # Reorder items
PATCH  /resource/{id}/toggle   # Toggle boolean state
POST   /resource/{id}/action   # Perform action
```

## 🛡️ Error Handling Strategy

### Error Hierarchy

```typescript
// Client errors (4xx)
400 Bad Request         // Invalid input
401 Unauthorized        // Missing/invalid token
403 Forbidden           // No permission
404 Not Found           // Resource doesn't exist

// Server errors (5xx)
500 Internal Error      // Unexpected error
503 Service Unavailable // Maintenance/overload
```

### Error Response Format

```json
{
  "success": false,
  "message": "User-friendly message",
  "error": "Technical details",
  "timestamp": "2024-02-16T10:30:00Z",
  "statusCode": 400
}
```

## 📊 Performance Optimization

### Database Queries

```typescript
// Always use selective fields
const module = await prisma.module.findUnique({
  where: { id },
  select: {
    id: true,
    name: true,
    slug: true,
    // Don't fetch unused fields
  }
});
```

### Pagination (Ready for Implementation)

```typescript
const modules = await prisma.module.findMany({
  where: { companyId },
  skip: (page - 1) * limit,
  take: limit,
  orderBy: { displayOrder: 'asc' }
});
```

### Caching Strategy (Future)

```typescript
// Use Redis for:
// - Company settings
// - Enabled modules
// - Published pages
// - Active connections
```

## 🔐 Security Best Practices

### Input Validation

```typescript
// Use Zod for schema validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

schema.parse(input); // Throws if invalid
```

### Password Security

```typescript
// Bcrypt with 10 rounds
const hashed = await bcrypt.hash(password, 10);

// Verify
const valid = await bcrypt.compare(input, hashed);
```

### SQL Injection Prevention

```typescript
// Prisma prevents SQL injection
// Parameters are properly escaped
const user = await prisma.user.findUnique({
  where: { email }  // Safe - no string interpolation
});
```

## 📈 Deployment Architecture

### Production Considerations

```
┌──────────────────────────────────────┐
│        Load Balancer                 │
└────────────────────┬─────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌───▼────┐  ┌───▼────┐
   │Instance1 │  │Instance2│  │Instance3│
   └────┬────┘  └───┬────┘  └───┬────┘
        │            │            │
        └────────────┼────────────┘
                     │
            ┌────────▼─────────┐
            │ PostgreSQL (RDS) │
            └──────────────────┘
```

### Environment-Specific Configurations

```env
# Development
DATABASE_URL="postgresql://localhost/ornave_dev"
JWT_SECRET="dev-secret"
NODE_ENV="development"

# Production
DATABASE_URL="postgresql://prod-user:pass@db.cloud/ornave"
JWT_SECRET="prod-secret-with-high-entropy"
NODE_ENV="production"
```

---

**This architecture is designed to scale from startup to enterprise, supporting millions of multi-tenant companies.**

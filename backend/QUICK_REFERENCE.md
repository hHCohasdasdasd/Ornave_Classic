# API Endpoint Quick Reference Card

## 🚀 Quick Start

### BaseURL
```
http://localhost:3000/api
```

### Authentication
All endpoints (except `/auth/register` and `/auth/login`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

### Response Format
```json
{
  "success": true|false,
  "data": { ... },
  "message": "Description",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## 🔐 Authentication (5 endpoints)

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/auth/register` | Create user account | ❌ No |
| POST | `/auth/login` | Get JWT token | ❌ No |
| GET | `/auth/profile` | Get user profile | ✅ Yes |
| GET | `/auth/verify` | Verify token validity | ✅ Yes |
| POST | `/auth/change-password` | Update password | ✅ Yes |

### Register
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Secure@2024",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "Secure@2024"
  }'
# Response includes: token, user, company
```

---

## 🏢 Company Management (7 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies` | Create company |
| GET | `/companies/:slug` | Get by slug |
| GET | `/companies/token/:token` | Get by token |
| GET | `/companies/:id` | Get by ID |
| PATCH | `/companies/:id/settings` | Update settings |
| GET | `/companies/:id/users` | List company users |
| POST | `/companies/:id/regenerate-token` | New company token |

### Create Company
```bash
curl -X POST http://localhost:3000/api/companies \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Acme Corp",
    "slug": "acme-corp",
    "description": "Leading provider of...",
    "website": "https://acmecorp.com"
  }'
```

---

## 📦 ERP Modules (8 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies/:cId/modules` | Create module |
| GET | `/companies/:cId/modules` | List all |
| GET | `/companies/:cId/modules/enabled` | List visible |
| GET | `/companies/:cId/modules/:id` | Get by ID |
| PATCH | `/companies/:cId/modules/:id` | Update |
| PATCH | `/companies/:cId/modules/:id/toggle` | Toggle visibility |
| POST | `/companies/:cId/modules/reorder` | Reorder |
| DELETE | `/companies/:cId/modules/:id` | Delete |

### Create Module
```bash
curl -X POST http://localhost:3000/api/companies/$COMPANY_ID/modules \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Custom CRM",
    "description": "Customer relationship management",
    "icon": "users",
    "visible": true
  }'
```

---

## 📄 Page Builder (10 endpoints)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies/:cId/pages` | Create page |
| GET | `/companies/:cId/pages` | List all |
| GET | `/companies/:cId/pages/published` | List published |
| GET | `/companies/:cId/pages/:id` | Get by ID |
| GET | `/companies/:cId/pages/slug/:slug` | Get by slug |
| PATCH | `/companies/:cId/pages/:id` | Update |
| PATCH | `/companies/:cId/pages/:id/layout` | Update layout |
| PATCH | `/companies/:cId/pages/:id/toggle` | Toggle publish |
| POST | `/companies/:cId/pages/reorder` | Reorder |
| DELETE | `/companies/:cId/pages/:id` | Delete |

### Create Page
```bash
curl -X POST http://localhost:3000/api/companies/$COMPANY_ID/pages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dashboard",
    "slug": "dashboard",
    "description": "Main dashboard",
    "layout": {
      "components": [
        {
          "type": "card",
          "title": "Sales Overview"
        }
      ]
    }
  }'
```

---

## 🔗 Connections (9 endpoints)

**Prerequisite**: Both companies must exist and be connected before transacting/messaging.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies/:cId/connections` | Send request |
| GET | `/companies/:cId/connections/outgoing` | View sent |
| GET | `/companies/:cId/connections/incoming` | View received |
| GET | `/companies/:cId/connections/active` | View active |
| GET | `/companies/:cId/connections/pending/count` | Pending count |
| GET | `/companies/:cId/connections/:connId` | Get details |
| PATCH | `/companies/:cId/connections/:connId/accept` | Accept |
| PATCH | `/companies/:cId/connections/:connId/reject` | Reject |
| PATCH | `/companies/:cId/connections/:connId/block` | Block |

### Send Connection Request
```bash
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/connections \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "requestMessage": "We would like to establish partnership"
  }'
```

### Accept Connection
```bash
curl -X PATCH http://localhost:3000/api/companies/$COMPANY_B_ID/connections/$CONNECTION_ID/accept \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 💼 Transactions (9 endpoints)

**Prerequisite**: Companies must be connected (ACCEPTED status) first.

**Types**: ORDER, PAYMENT, SHIPMENT, INVOICE, QUOTE, CUSTOM

**Status Flow**: PENDING → ACCEPTED → PROCESSING → COMPLETED (or REJECTED/FAILED)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies/:cId/transactions` | Create |
| GET | `/companies/:cId/transactions/sent` | View sent |
| GET | `/companies/:cId/transactions/received` | View received |
| GET | `/companies/:cId/transactions/:txId` | Get by ID |
| GET | `/companies/:cId/transactions/reference?ref=` | Get by reference |
| GET | `/companies/:cId/transactions/stats` | Get statistics |
| GET | `/companies/:cId/transactions/recent` | Get recent |
| PATCH | `/companies/:cId/transactions/:txId/status` | Update status |
| PATCH | `/companies/:cId/transactions/:txId/data` | Update data |

### Create Transaction
```bash
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/transactions \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "type": "ORDER",
    "reference": "ORD-2024-001",
    "data": {
      "items": [
        { "sku": "ITEM-1", "qty": 100, "price": 10.50 }
      ],
      "total": 1050.00
    }
  }'
```

### Update Transaction Status
```bash
curl -X PATCH http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED"
  }'
# Valid transitions: PENDING→ACCEPTED, ACCEPTED→PROCESSING, PROCESSING→COMPLETED
```

### Get Statistics
```bash
curl -X GET http://localhost:3000/api/companies/$COMPANY_ID/transactions/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## 💬 Messages (11 endpoints)

**Prerequisite**: Companies must be connected first.

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/companies/:cId/messages` | Send message |
| GET | `/companies/:cId/messages/received` | View received |
| GET | `/companies/:cId/messages/sent` | View sent |
| GET | `/companies/:cId/messages/:msgId` | Get message |
| GET | `/companies/:cId/messages/unread/count` | Unread count |
| GET | `/companies/:cId/messages/conversations` | List conversations |
| GET | `/companies/:cId/messages/conversations/:otherId` | Get conversation |
| PATCH | `/companies/:cId/messages/:msgId/read` | Mark read |
| PATCH | `/companies/:cId/messages/read-multiple` | Batch mark read |
| DELETE | `/companies/:cId/messages/:msgId` | Delete |

### Send Message
```bash
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/messages \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "subject": "Order ORD-2024-001 Update",
    "content": "Your order has been processed and is ready for shipment."
  }'
```

### Get Conversation
```bash
curl -X GET http://localhost:3000/api/companies/$COMPANY_ID/messages/conversations/$OTHER_COMPANY_ID \
  -H "Authorization: Bearer $TOKEN"
# Returns all messages (both directions) with specific company
```

### Mark as Read
```bash
curl -X PATCH http://localhost:3000/api/companies/$COMPANY_ID/messages/$MESSAGE_ID/read \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📊 Common Filters

### Get with Filters
```bash
# Get sent transactions of type ORDER with PENDING status
curl -X GET "http://localhost:3000/api/companies/$ID/transactions/sent?type=ORDER&status=PENDING" \
  -H "Authorization: Bearer $TOKEN"

# Get received messages (only unread)
curl -X GET "http://localhost:3000/api/companies/$ID/messages/received?isRead=false" \
  -H "Authorization: Bearer $TOKEN"

# Get pending connections only
curl -X GET "http://localhost:3000/api/companies/$ID/connections/incoming?status=PENDING" \
  -H "Authorization: Bearer $TOKEN"
```

### Pagination
```bash
# Get last 10 recent transactions (default)
curl -X GET "http://localhost:3000/api/companies/$ID/transactions/recent" \
  -H "Authorization: Bearer $TOKEN"

# Get last 5 transactions
curl -X GET "http://localhost:3000/api/companies/$ID/transactions/recent?limit=5" \
  -H "Authorization: Bearer $TOKEN"
```

---

## ❌ HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, PATCH |
| 201 | Created | Successful POST |
| 400 | Bad Request | Validation error, invalid input |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Company context mismatch |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unexpected error |

## Error Response Example
```json
{
  "success": false,
  "message": "Companies must be connected to transact",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": null
}
```

---

## 🧪 Test Flow

```bash
# 1. Register Company A
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"a@a.com","password":"Pass@123","firstName":"A","lastName":"A"}'
# Save COMPANY_A_ID and TOKEN_A

# 2. Register Company B
# (Similar to step 1 with different email)
# Save COMPANY_B_ID and TOKEN_B

# 3. Company A sends connection request
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/connections \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{"toCompanyId":"'$COMPANY_B_ID'"}'
# Save CONNECTION_ID

# 4. Company B accepts connection
curl -X PATCH http://localhost:3000/api/companies/$COMPANY_B_ID/connections/$CONNECTION_ID/accept \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{}'

# 5. Company A sends transaction
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/transactions \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId":"'$COMPANY_B_ID'",
    "type":"ORDER",
    "reference":"ORD-001",
    "data":{"amount":1000}
  }'
# Save TRANSACTION_ID

# 6. Company B accepts transaction
curl -X PATCH http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status \
  -H "Authorization: Bearer $TOKEN_B" \
  -H "Content-Type: application/json" \
  -d '{"status":"ACCEPTED"}'

# 7. Companies exchange messages
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/messages \
  -H "Authorization: Bearer $TOKEN_A" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId":"'$COMPANY_B_ID'",
    "subject":"Update",
    "content":"Order is ready"
  }'

# 8. View conversation
curl -X GET http://localhost:3000/api/companies/$COMPANY_B_ID/messages/conversations/$COMPANY_A_ID \
  -H "Authorization: Bearer $TOKEN_B"
```

---

## 📚 Documentation Links

- **Complete API Reference**: IMPLEMENTATION_OVERVIEW.md
- **Phase 1 Details**: PHASE_1_SUMMARY.md
- **Phase 2 Details**: PHASE_2_SUMMARY.md
- **Testing Examples**: TESTING.md (Phase 1), PHASE_2_TESTING.md (Phase 2)
- **Architecture**: ARCHITECTURE.md
- **Getting Started**: README.md
- **Full Index**: INDEX.md

---

## 💡 Tips

✅ Always include `Authorization: Bearer $TOKEN` header
✅ Use `-H "Content-Type: application/json"` for POST/PATCH
✅ Save IDs from responses for subsequent requests
✅ Connect companies before creating transactions/messages
✅ Use query parameters for filtering: `?type=ORDER&status=PENDING`
✅ Check response `success` field to verify request worked
✅ Read `message` field for error descriptions

---

**Total Endpoints**: 59
**Authentication**: JWT Bearer Token (7-day expiry)
**Database**: PostgreSQL
**Ready for**: Production deployment

For detailed examples, see the full testing guides! 🚀

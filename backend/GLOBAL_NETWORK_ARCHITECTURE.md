# GLOBAL BUSINESS NETWORK ARCHITECTURE

## Overview

We have transformed Ornave from an isolated multi-tenant ERP into a **Global Business Network** - a distributed B2B infrastructure where companies can discover, connect, and exchange structured data seamlessly.

This is NOT a marketplace. This is **ERP-to-ERP interoperability** built on top of your existing multi-tenant foundation.

---

## Phase Breakdown

### PHASE 1: Global Company Identity Layer
**Status**: ✅ Implemented

**What Changed**:
- Extended `Company` model with public profile fields
  - `country`, `industry`, `capabilities`
  - `isPublicProfile`, `isVerified`
- Created `CompanyProfile` model for detailed profile management
- Built `GlobalDirectoryService` for B2B discovery

**Key Concept**: Companies maintain a public profile discoverable via industry, country, and services offered. All search is read-only and doesn't leak sensitive data.

**Service**: `GlobalDirectoryService`
- `searchDirectory(filters)` - Find companies by industry, country, services
- `updateCompanyProfile(data)` - Companies control their own visibility
- `getPublicProfile(companyId)` - View verified companies

---

### PHASE 2: Trust & Connection System
**Status**: ✅ Implemented

**What Changed**:
- Upgraded `CompanyConnection` model
  - Added `connectionType` field (SUPPLIER, CLIENT, PARTNER, GROUP_ENTITY)
- Created `ConnectionPermission` model for granular access control
- Each connection has specific permission grants

**Key Concept**: Before data can be shared, companies must explicitly connect AND grant permissions. Trust is explicit, not implicit.

**Connection Lifecycle**:
1. Company A requests connection to Company B
2. Company B reviews and accepts
3. Company B grants specific permissions (view inventory, create orders, etc.)
4. Once ACCEPTED and permissions granted, transactions can flow

**Service**: `ConnectionService` (enhanced)
- `requestConnection()` - Request connection
- `acceptConnection()` - Accept with permission grants
- `grantPermissions()` - Update permissions anytime
- `hasPermission()` - Check if action is allowed

**Permissions**:
- `canViewInventory`
- `canCreateOrders`
- `canViewOrders`
- `canCreateInvoices`
- `canViewInvoices`
- `canAccessPricing`
- `canReceiveMessages`
- `customPermissions` (JSON for extensibility)

---

### PHASE 3: Global Transaction Engine
**Status**: ✅ Implemented

**What Changed**:
- Created `GlobalTransaction` model for B2B document exchange
  - PurchaseOrders, Invoices, Shipments, Contracts, Quotes, Payments
  - Full status synchronization between tenants
  - Audit trail with status history

**Key Concept**: Transactions are the "wire protocol" of the network. Each transaction must exist in both tenants and their status is the single source of truth.

**Transaction Lifecycle**:
1. **DRAFT** → Sender creates locally
2. **SENT** → Sender transmits to receiver
3. **RECEIVED** → Receiver acknowledges receipt
4. **ACCEPTED/REJECTED** → Receiver approves or declines
5. **PROCESSING/COMPLETED** → Fulfillment states
6. **FAILED** → Error state with reason

**Key Fields**:
- `globalReference` - Globally unique ID (immutable)
- `senderReference` - Sender's internal reference
- `receiverReference` - Receiver's internal reference (idempotency)
- `payload` - Transaction data (JSON, flexible)
- `statusHistory` - Full audit trail

**Service**: `GlobalTransactionService`
- `createTransaction()` - Create new transaction (checks permissions)
- `sendTransaction()` - Mark as sent
- `receiveTransaction()` - Acknowledge receipt
- `acceptTransaction()` / `rejectTransaction()` - Approve or decline
- `getTransactions()` - Retrieve company's transactions

---

### PHASE 4: Data Mapping Layer (Interoperability)
**Status**: ✅ Implemented

**What Changed**:
- Created `ModuleMapping` model to define how internal modules map to global objects
- Enabled field-level transformation between representations

**Key Concept**: Companies customize modules internally (e.g., "Orders", "Sales Pipeline") but when exchanging data, they must map to global standard objects.

**Global Standard Objects**:
- `GlobalPurchaseOrder`
- `GlobalInvoice`
- `GlobalShipment`
- `GlobalInventoryItem`
- `GlobalPayment`
- `GlobalContract`

**Example**:
```
Company A's "Sales" module → GlobalInvoice
  - A's "orderId" → Invoice's "invoiceNumber"
  - A's "customerId" → Invoice's "buyerCompanyId"

Company B's "Purchasing" module ← GlobalInvoice
  - Invoice's "invoiceNumber" → B's "supplierInvoiceNo"
  - Invoice's "buyerCompanyId" → B's "vendorId"
```

**Service**: `DataMappingService`
- `defineModuleMapping()` - Set up mapping for a module
- `transformToGlobal()` - Internal data → Global format
- `transformToInternal()` - Global format → Internal data
- `getSuggestedMapping()` - AI-ready suggestions

---

### PHASE 5: Global Activity Stream
**Status**: ✅ Implemented

**What Changed**:
- Created `ActivityEvent` model for event logging
- Each company sees their own activity feed

**Key Concept**: Companies get real-time visibility into what's happening across their network. Dashboard shows:
- Incoming connection requests
- Pending transactions
- Transaction status changes
- Permission updates

**Event Types**:
- CONNECTION_REQUEST_RECEIVED
- CONNECTION_ACCEPTED / REJECTED / BLOCKED
- TRANSACTION_RECEIVED / SENT / ACCEPTED / REJECTED / COMPLETED
- PERMISSION_GRANTED / REVOKED
- PROFILE_VERIFIED

**Service**: `ActivityStreamService`
- `logEvent()` - Log an event
- `getActivityFeed()` - Retrieve company's events
- `getUrgentEvents()` - High-priority notifications
- `getUnreadCount()` - For badge counter
- `createConnectionRequestEvent()` - Auto-generate events

---

## Architectural Principles

### 1. Strict Multi-Tenancy
- Data is NEVER shared across tenants without explicit permission
- Every query filters by `companyId`
- Cross-company transactions store data in both databases (distributed)

### 2. Service Layer Pattern
- All business logic in `/services`
- Controllers only handle HTTP concerns
- Services can be extracted to microservices later

### 3. Event-Driven (Ready)
- Activity stream supports real-time notifications
- Can integrate WebSockets for live updates
- Audit trail enables compliance and debugging

### 4. Extensibility
- `customPermissions` (JSON) for non-standard permission types
- `payload` in GlobalTransaction is flexible JSON
- `customConfig` in CompanySettings for company-specific data
- `config` in Module for module-specific settings

### 5. Scalability Ready
- Indexed tables for fast queries
- Prepared for distributed transactions (eventual consistency)
- Can split into microservices per phase:
  - Auth service
  - Company service
  - Connection service
  - Transaction service
  - etc.

---

## Data Flow Examples

### Example 1: Company Discovery
```
User searches directory:
  ↓
GlobalDirectoryService.searchDirectory({industry: "Manufacturing", country: "US"})
  ↓
Returns public CompanyProfile records where isPublicProfile=true & isVerified=true
  ↓
User sees: [Company A, Company B, Company C]
```

### Example 2: Connection Request → Transaction
```
Company A requests connection to Company B:
  ↓
ConnectionService.requestConnection()
  ↓
Company B accepts + grants permissions:
  ↓
ConnectionService.acceptConnection({canCreateOrders: true, canViewInvoices: true})
  ↓
Company A creates PurchaseOrder:
  ↓
GlobalTransactionService.createTransaction()
  ↓
Checks ConnectionService.hasPermission() → true
  ↓
Creates GlobalTransaction with status=DRAFT
  ↓
Company A sends:
  ↓
GlobalTransactionService.sendTransaction() → status=SENT
  ↓
ActivityStreamService.createTransactionReceivedEvent() for Company B
  ↓
Company B sees notification + can accept/reject
```

### Example 3: Data Mapping
```
Company A's internal "Sales" module creates an order:
  {orderId: 123, customerId: "XYZ", amount: 1000}
  ↓
DataMappingService.transformToGlobal()
  ↓
Applies field mapping: orderId → invoiceNumber, etc.
  ↓
Returns: {invoiceNumber: 123, buyerCompanyId: "XYZ", totalAmount: 1000}
  ↓
Sent in GlobalTransaction.payload
  ↓
Company B receives:
  ↓
DataMappingService.transformToInternal()
  ↓
Applies reverse mapping
  ↓
Returns: {supplierInvoiceNo: 123, vendorId: "XYZ", invoiceAmount: 1000}
  ↓
Imported into Company B's Purchasing module
```

---

## Database Schema Additions

### New Models
```prisma
// Phase 1
- CompanyProfile (company public profile)

// Phase 2
- CompanyConnection (upgraded with connectionType)
- ConnectionPermission (granular permissions)

// Phase 3
- GlobalTransaction (B2B document exchange)

// Phase 4
- ModuleMapping (internal ↔ global mapping)

// Phase 5
- ActivityEvent (event stream)
```

### Updated Models
```prisma
// Company - Added fields:
- registrationNumber
- country
- industry
- capabilities (JSON)
- isPublicProfile
- isVerified
- verificationToken

// Relationships added:
- companyProfiles → CompanyProfile
- connectionPermissions → ConnectionPermission
- sentTransactions, receivedTransactions → GlobalTransaction
- activityEvents → ActivityEvent
```

---

## API Endpoints (To be created)

### Discovery
```
GET  /api/directory/search?industry=Manufacturing&country=US
GET  /api/directory/companies/:id
```

### Connections
```
POST /api/connections (request connection)
POST /api/connections/:id/accept (accept + grant permissions)
POST /api/connections/:id/permissions (update permissions)
GET  /api/connections
```

### Transactions
```
POST /api/transactions (create)
POST /api/transactions/:id/send (send)
POST /api/transactions/:id/receive (acknowledge)
POST /api/transactions/:id/accept (approve)
POST /api/transactions/:id/reject (decline)
GET  /api/transactions (list)
GET  /api/transactions/:id (details)
```

### Activity
```
GET  /api/activity/feed?unreadOnly=true
POST /api/activity/events/:id/read
POST /api/activity/read-all
GET  /api/activity/stats
```

### Data Mapping
```
POST /api/mappings (define mapping)
GET  /api/mappings/:moduleName (get mapping)
GET  /api/mappings (list company's mappings)
```

---

## Future Enhancements

1. **AI-Powered Mapping Suggestions**
   - Analyze module structure and suggest field mappings
   - Learn from successful company integrations

2. **Blockchain/Immutable Ledger**
   - Store transaction audit trail on blockchain
   - Dispute resolution with cryptographic proof

3. **Advanced Permission Model**
   - Time-based permissions (valid until date)
   - Rate limiting per connection
   - Dynamic permissions based on transaction amount/type

4. **Real-Time Sync**
   - WebSocket support for live updates
   - Bi-directional inventory sync
   - Live order tracking

5. **Microservices**
   - Split each phase into independent service
   - Event bus for inter-service communication
   - Eventual consistency for distributed transactions

6. **Compliance & Audit**
   - SOX/GDPR compliance reporting
   - Audit trail export
   - Data residency enforcement

---

## Implementation Notes

### No Breaking Changes
- All existing company ERP functionality remains untouched
- New models are additive
- Existing routes/controllers unmodified
- New features are opt-in

### Database Migration
- Single migration: `add_global_business_network`
- SQLite compatible (but ready for PostgreSQL)
- Indexed for performance

### Service Layer Isolation
- Each service is independent
- Services call each other (future: event bus)
- Easy to extract to microservices

---

## Summary

You now have infrastructure for:

✅ **Global B2B Discovery** - Companies find each other  
✅ **Trust & Connection** - Explicit permission model  
✅ **Distributed Transactions** - Sync data across tenants  
✅ **Data Interoperability** - Map internal ↔ global formats  
✅ **Activity Visibility** - Real-time feed of network events  

This is **enterprise-grade digital infrastructure** - not a SaaS hack.

The architecture supports everything from a startup's first connection to a global supply chain with millions of daily transactions.

All without breaking your existing system. 🚀

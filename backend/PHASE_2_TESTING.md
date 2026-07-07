# Phase 2 API Testing Guide

## Prerequisites
- Server running on `http://localhost:3000`
- Two test companies created with valid JWT tokens
- Test companies connected before attempting transactions/messages

## Test Data Setup

### Step 1: Create Test Companies

```bash
# Company A Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companya.com",
    "password": "CompanyA@2024",
    "firstName": "Admin",
    "lastName": "CompanyA"
  }'

# Company B Registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companyb.com",
    "password": "CompanyB@2024",
    "firstName": "Admin",
    "lastName": "CompanyB"
  }'
```

### Step 2: Login and Get Tokens

```bash
# Login Company A
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companya.com",
    "password": "CompanyA@2024"
  }'
# Save the token and companyId from response

# Login Company B
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@companyb.com",
    "password": "CompanyB@2024"
  }'
# Save the token and companyId from response
```

### Step 3: Get Company IDs

```bash
# Get Company A details (use token from login)
curl -X GET http://localhost:3000/api/companies/company-a-slug \
  -H "Authorization: Bearer COMPANY_A_TOKEN"

# Get Company B details
curl -X GET http://localhost:3000/api/companies/company-b-slug \
  -H "Authorization: Bearer COMPANY_B_TOKEN"

# Store the ids as:
# COMPANY_A_ID = "from Company A response"
# COMPANY_B_ID = "from Company B response"
```

## Connection Management Tests

### Test 1: Send Connection Request

**Scenario**: Company A sends connection request to Company B

```bash
COMPANY_A_ID="<from-step-3>"
COMPANY_B_ID="<from-step-3>"
COMPANY_A_TOKEN="<from-step-2>"

curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/connections \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "requestMessage": "We would like to establish a business relationship"
  }'

# Expected Response (201):
# {
#   "success": true,
#   "data": {
#     "id": "connection-id",
#     "fromCompanyId": "COMPANY_A_ID",
#     "toCompanyId": "COMPANY_B_ID",
#     "status": "PENDING",
#     "requestMessage": "We would like to establish a business relationship",
#     "createdAt": "2024-01-15T10:30:00Z"
#   },
#   "message": "Connection request sent"
# }
```

Save the `connection-id` for next tests.

### Test 2: Get Outgoing Connections

**Scenario**: Company A views all sent requests

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/connections/outgoing" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected: Array with connection sent to Company B with PENDING status
```

### Test 3: Get Incoming Connections

**Scenario**: Company B views received requests

```bash
COMPANY_B_TOKEN="<from-step-2>"

curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/incoming" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: Array with connection from Company A with PENDING status
# Save the connection-id for accepting
```

### Test 4: Accept Connection

**Scenario**: Company B accepts connection from Company A

```bash
CONNECTION_ID="<from-test-3>"

curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/$CONNECTION_ID/accept" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected (200):
# {
#   "success": true,
#   "data": {
#     "status": "ACCEPTED",
#     ...
#   },
#   "message": "Connection accepted"
# }
```

### Test 5: Get Active Connections

**Scenario**: View established connections

```bash
# Company A views active connections
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/connections/active" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Should include connection to Company B with ACCEPTED status

# Company B views active connections
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/active" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Should include connection from Company A with ACCEPTED status
```

### Test 6: Get Pending Count

**Scenario**: Check unreviewed requests

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/pending/count" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected (after accepting the one request):
# {
#   "success": true,
#   "data": { "count": 0 },
#   "message": "Pending count retrieved"
# }
```

### Test 7: Block Connection (Optional)

**Scenario**: Block future requests from a company

```bash
# Create another connection to test blocking
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/connections \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'"
  }'

# Get the new connection ID and block it
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/$NEW_CONNECTION_ID/block" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: Connection status becomes BLOCKED
```

### Test 8: Reject Connection (Optional)

**Scenario**: Decline incoming request

```bash
# Create another connection to test rejection
curl -X POST http://localhost:3000/api/companies/$COMPANY_A_ID/connections \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'"
  }'

# Get the new connection ID and reject it
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/$NEW_CONNECTION_ID/reject" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: Connection status becomes REJECTED
```

## Transaction Management Tests

**Prerequisite**: Companies must be connected (ACCEPTED status) before transacting.

### Test 1: Create Order Transaction

**Scenario**: Company A sends purchase order to Company B

```bash
TRANSACTION_DATA='{
  "productIds": ["PROD-001", "PROD-002"],
  "quantities": [100, 50],
  "unitPrices": [10.50, 25.00],
  "total": 2300.00,
  "deliveryDate": "2024-02-15",
  "notes": "Urgent - please prioritize"
}'

curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "type": "ORDER",
    "reference": "ORD-2024-001",
    "data": '$TRANSACTION_DATA'
  }'

# Expected (201):
# {
#   "success": true,
#   "data": {
#     "id": "transaction-id",
#     "fromCompanyId": "COMPANY_A_ID",
#     "toCompanyId": "COMPANY_B_ID",
#     "type": "ORDER",
#     "status": "PENDING",
#     "reference": "ORD-2024-001",
#     "data": { ... },
#     "createdAt": "2024-01-15T11:00:00Z"
#   },
#   "message": "Transaction created"
# }
```

Save `transaction-id` and `reference`.

### Test 2: Get Sent Transactions

**Scenario**: Company A views all transactions sent

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/sent" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Query parameters:
# ?type=ORDER - Filter by type
# ?status=PENDING - Filter by status
# ?type=ORDER&status=PENDING - Combined filters

# Example with filters:
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/sent?type=ORDER&status=PENDING" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected: Array with sent transactions matching filters
```

### Test 3: Get Received Transactions

**Scenario**: Company B views incoming transactions

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/received" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Supports same query filters as sent transactions
```

### Test 4: Get Transaction by Reference

**Scenario**: Lookup transaction by external reference

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/reference?reference=ORD-2024-001" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: Single transaction object with matching reference
```

### Test 5: Accept Transaction

**Scenario**: Company B accepts purchase order

```bash
TRANSACTION_ID="<from-test-1>"

curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "ACCEPTED"
  }'

# Expected: Transaction status = ACCEPTED
```

### Test 6: Move Transaction to Processing

**Scenario**: Order enters fulfillment phase

```bash
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PROCESSING"
  }'

# Expected: Status = PROCESSING, validating transition ACCEPTED → PROCESSING
```

### Test 7: Complete Transaction

**Scenario**: Order fulfilled and completed

```bash
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED"
  }'

# Expected: Status = COMPLETED
```

### Test 8: Update Transaction Data

**Scenario**: Add or modify transaction details

```bash
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/$TRANSACTION_ID/data" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "trackingNumber": "TRACK-2024-123456",
      "estimatedDelivery": "2024-02-12",
      "carrier": "FedEx",
      "additionalNotes": "Priority handling applied"
    }
  }'

# Expected: Transaction data updated with new values
```

### Test 9: Get Transaction Statistics

**Scenario**: View transaction summary

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/stats" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected:
# {
#   "success": true,
#   "data": {
#     "totalTransactions": 5,
#     "byStatus": {
#       "PENDING": 1,
#       "ACCEPTED": 1,
#       "PROCESSING": 1,
#       "COMPLETED": 2,
#       "FAILED": 0,
#       "REJECTED": 0
#     },
#     "byType": {
#       "ORDER": 3,
#       "PAYMENT": 2,
#       ...
#     },
#     "recentCount": 3
#   },
#   "message": "Transaction stats retrieved"
# }
```

### Test 10: Get Recent Transactions

**Scenario**: Get last N transactions

```bash
# Get last 5 transactions (default is 10)
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/recent?limit=5" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected: Array of most recent transactions
```

### Test 11: Transaction Status Validation

**Scenario**: Attempt invalid status transition (should fail)

```bash
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/transactions/$TRANSACTION_ID/status" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING"
  }'

# Expected (400): Error - invalid transition from COMPLETED to PENDING
```

### Test 12: Other Transaction Types

**Create Invoice**:
```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "type": "INVOICE",
    "reference": "INV-2024-001",
    "data": {
      "amount": 2300.00,
      "dueDate": "2024-02-28",
      "invoiceNumber": "INV-2024-001",
      "lineItems": [
        { "description": "Products", "amount": 2300.00 }
      ]
    }
  }'
```

**Create Payment**:
```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "type": "PAYMENT",
    "reference": "PAY-2024-001",
    "data": {
      "amount": 2300.00,
      "method": "Bank Transfer",
      "reference": "PAY-2024-001"
    }
  }'
```

**Create Shipment**:
```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "type": "SHIPMENT",
    "reference": "SHIP-2024-001",
    "data": {
      "weight": 150,
      "dimensions": "100x100x50cm",
      "carrier": "DHL",
      "trackingNumber": "1234567890",
      "estimatedDelivery": "2024-02-15"
    }
  }'
```

## Message Management Tests

**Prerequisite**: Companies must be connected before messaging.

### Test 1: Send Message

**Scenario**: Company A sends message to Company B

```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/messages" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "subject": "Regarding Order ORD-2024-001",
    "content": "Hi, we have received your order and started processing. We will notify you about the shipment status soon."
  }'

# Expected (201):
# {
#   "success": true,
#   "data": {
#     "id": "message-id",
#     "fromCompanyId": "COMPANY_A_ID",
#     "toCompanyId": "COMPANY_B_ID",
#     "subject": "Regarding Order ORD-2024-001",
#     "content": "Hi, we have received your order...",
#     "isRead": false,
#     "createdAt": "2024-01-15T12:00:00Z"
#   },
#   "message": "Message sent"
# }
```

### Test 2: Get Received Messages

**Scenario**: Company B views all received messages

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/received" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Query parameters:
# ?isRead=true - Get only read messages
# ?isRead=false - Get only unread messages

# Get unread messages
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/received?isRead=false" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: Array of received messages
```

### Test 3: Get Sent Messages

**Scenario**: Company A views all sent messages

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/messages/sent" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected: Array of sent messages
```

### Test 4: Get Unread Count

**Scenario**: Quick check on new messages

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/unread/count" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected:
# {
#   "success": true,
#   "data": { "count": 1 },
#   "message": "Unread count retrieved"
# }
```

### Test 5: Mark Message as Read

**Scenario**: Mark single message as read

```bash
MESSAGE_ID="<from-test-1>"

curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/$MESSAGE_ID/read" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected: Message with isRead = true
```

### Test 6: Get Unread Count After Reading

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/unread/count" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: count = 0
```

### Test 7: Get Conversation

**Scenario**: View full conversation between two companies

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/conversations/$COMPANY_A_ID" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: Array of all messages exchanged between these companies, both directions
```

### Test 8: Send Reply

**Scenario**: Company B replies to message

```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_B_ID/messages" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_A_ID'",
    "subject": "RE: Regarding Order ORD-2024-001",
    "content": "Thank you for the update. We look forward to receiving the shipment."
  }'
```

### Test 9: Get Conversation After Reply

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/messages/conversations/$COMPANY_B_ID" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected: Array with both original message and reply
```

### Test 10: Get Conversation List

**Scenario**: View all active conversations

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/messages/conversations" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected:
# {
#   "success": true,
#   "data": [
#     {
#       "otherCompanyId": "COMPANY_B_ID",
#       "lastMessage": "...",
#       "messageCount": 2,
#       "unreadCount": 0,
#       "lastMessageTime": "2024-01-15T12:05:00Z"
#     }
#   ],
#   "message": "Conversation list retrieved"
# }
```

### Test 11: Mark Multiple Messages as Read

**Scenario**: Batch mark messages as read

```bash
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/read-multiple" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageIds": ["message-id-1", "message-id-2", "message-id-3"]
  }'

# Expected: All specified messages marked as read
```

### Test 12: Delete Message

**Scenario**: Remove a message

```bash
curl -X DELETE "http://localhost:3000/api/companies/$COMPANY_B_ID/messages/$MESSAGE_ID" \
  -H "Authorization: Bearer $COMPANY_B_TOKEN"

# Expected: Message deleted successfully
```

## Error Scenarios & Validation

### Test 1: Unauthorized Access

```bash
# Without token
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/connections/active"

# Expected (401): "Unauthorized"

# With invalid token
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/connections/active" \
  -H "Authorization: Bearer invalid-token"

# Expected (401): "Invalid token"
```

### Test 2: Company Context Mismatch

```bash
# User from Company A trying to access Company B's data
curl -X GET "http://localhost:3000/api/companies/$COMPANY_B_ID/connections/active" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected (403): "Forbidden - Company context mismatch"
```

### Test 3: Transaction Without Connection

```bash
# Create two new companies that are not connected
# Try to create transaction between them

curl -X POST "http://localhost:3000/api/companies/$COMPANY_C_ID/transactions" \
  -H "Authorization: Bearer $COMPANY_C_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_D_ID'",
    "type": "ORDER",
    "data": { "amount": 1000 }
  }'

# Expected (400): "Companies must be connected to transact"
```

### Test 4: Message Without Connection

```bash
curl -X POST "http://localhost:3000/api/companies/$COMPANY_C_ID/messages" \
  -H "Authorization: Bearer $COMPANY_C_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_D_ID'",
    "content": "Hello"
  }'

# Expected (400): "Companies must be connected to message"
```

### Test 5: Invalid Status Transition

```bash
# Try to move from COMPLETED back to PENDING
curl -X PATCH "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/$TRANSACTION_ID/status" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "PENDING"
  }'

# Expected (400): "Invalid status transition"
```

### Test 6: Missing Required Fields

```bash
# Missing toCompanyId
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/connections" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestMessage": "Hello"
  }'

# Expected (400): Validation error - "Company ID required"

# Missing message content
curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/messages" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "toCompanyId": "'$COMPANY_B_ID'",
    "subject": "Test"
  }'

# Expected (400): Validation error - "Message content required"
```

### Test 7: Non-Existent Resource

```bash
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/connections/invalid-connection-id" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"

# Expected (404): "Connection not found"
```

## Performance Tests

### Test 1: Bulk Transaction Creation

```bash
# Create 10 transactions in sequence
for i in {1..10}; do
  curl -X POST "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions" \
    -H "Authorization: Bearer $COMPANY_A_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "toCompanyId": "'$COMPANY_B_ID'",
      "type": "ORDER",
      "reference": "ORD-2024-'$i'",
      "data": { "items": '$i', "total": '$((i * 100))' }
    }'
done
```

### Test 2: Retrieve Large Result Set

```bash
# Get all sent transactions (should handle many results efficiently)
curl -X GET "http://localhost:3000/api/companies/$COMPANY_A_ID/transactions/sent" \
  -H "Authorization: Bearer $COMPANY_A_TOKEN"
```

## Summary

This testing guide covers:
- ✅ 29 API endpoints across 3 domains
- ✅ Connection lifecycle (send, view, accept, reject, block)
- ✅ Transaction workflow (create, status transitions, updates)
- ✅ Message management (send, read, conversations, bulk operations)
- ✅ Error scenarios and validations
- ✅ Multi-tenancy isolation
- ✅ Performance considerations

All tests assume the server is running and test data is properly created. Adjust company IDs and tokens as needed for your test environment.


# REFERRALS & PROMOTIONS API CONTRACT

**Version:** 1.0  
**Base URL:** `https://api.server.raut.app`  
**Auth:** All endpoints require `Authorization: Bearer {token}` header  
**Admin endpoints:** Require admin role

---

## TABLE OF CONTENTS

1. [Referral Programs CRUD](#referral-programs-crud)
2. [Enrollment (Add Users to Programs)](#enrollment)
3. [View Users & Codes](#view-users--codes)
4. [View Relationships](#view-relationships)
5. [Stats & Payments](#stats--payments)
6. [User Endpoints](#user-endpoints)
7. [Promotions System](#promotions-system)
8. [Complete Workflows](#complete-workflows)

---

## REFERRAL PROGRAMS CRUD

### 1. Create Program (Admin)

**Endpoint:** `POST /referrals/programs`

**Request Body:**
```json
{
  "name": "Default Referral Program",
  "description": "Standard rewards for all users",
  "is_default": true,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "first_ride"
    },
    "referee": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "signup"
    }
  },
  "target_referee_type": null,
  "max_referrals_per_user": null,
  "reward_expiry_days": null,
  "start_date": null,
  "end_date": null,
  "priority": 0,
  "is_active": true
}
```

**reward_config Field Explained:**

The `reward_config` is a JSON object that defines rewards for both sides:
- `referrer`: Person who shares their code
- `referee`: Person who uses the code

**Reward Types:**

```json
// 1. FIXED Amount (most common)
{
  "type": "fixed",
  "amount": 2000,           // Amount in TZS
  "trigger": "first_ride"   // When to pay
}

// 2. PERCENTAGE of Ride
{
  "type": "percentage",
  "rate": 0.02,             // 2% = 0.02
  "trigger": "first_ride",
  "max_amount": 5000        // Cap at 5000 TZS
}

// 3. COMMISSION (ongoing percentage)
{
  "type": "commission",
  "rate": 0.05,             // 5% of every ride
  "duration_days": 90,      // For 90 days
  "trigger": "signup"
}
```

**Trigger Events:**
- `signup` - When referee registers
- `first_ride` - When referee completes first ride
- `onboarding_complete` - When referee finishes onboarding
- `document_verified` - When referee's documents verified

**Examples:**

```javascript
// Example 1: Default Program (both get 2k after first ride)
{
  "name": "Default Program",
  "is_default": true,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "first_ride"
    },
    "referee": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "signup"
    }
  },
  "target_referee_type": null,  // Any user type
  "priority": 0,
  "is_active": true
}

// Example 2: Field Officer (driver onboarding only)
{
  "name": "Field Officer Program",
  "is_default": false,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 500,
      "trigger": "onboarding_complete"
    },
    "referee": null  // Driver gets nothing
  },
  "target_referee_type": "driver",  // Only drivers count
  "priority": 10,  // Higher priority than default
  "is_active": true
}

// Example 3: Referee gets 2% of first ride
{
  "name": "Percentage Reward",
  "is_default": false,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "first_ride"
    },
    "referee": {
      "type": "percentage",
      "rate": 0.02,              // 2%
      "trigger": "first_ride",
      "max_amount": 5000         // Cap at 5000 TZS
    }
  },
  "target_referee_type": null,
  "priority": 0,
  "is_active": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Default Referral Program",
  "description": "Standard rewards for all users",
  "is_default": true,
  "reward_config": { ... },
  "target_referee_type": null,
  "max_referrals_per_user": null,
  "reward_expiry_days": null,
  "start_date": null,
  "end_date": null,
  "priority": 0,
  "is_active": true,
  "created_at": "2026-11-09T...",
  "updated_at": "2026-11-09T..."
}
```

### 2. List Programs (Admin)

**Endpoint:** `GET /referrals/programs?active_only=true`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Default Program",
    "is_default": true,
    "reward_config": { ... },
    "priority": 0,
    "is_active": true
  },
  {
    "id": "uuid2",
    "name": "Field Officer Program",
    "is_default": false,
    "reward_config": { ... },
    "priority": 10,
    "is_active": true
  }
]
```

### 3. Update Program (Admin)

**Endpoint:** `PUT /referrals/programs/{program_id}`

**Request Body:** (all fields optional)
```json
{
  "name": "Updated Program Name",
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 3000,
      "trigger": "first_ride"
    }
  },
  "is_active": false
}
```

---

## ENROLLMENT

### 4. Enroll Single User (Admin)

**Endpoint:** `POST /referrals/programs/{program_id}/enroll?user_id={user_id}`

**Response:**
```json
{
  "id": "enrollment_uuid",
  "program_id": "uuid",
  "user_id": "uuid",
  "enrolled_at": "2026-11-09T...",
  "enrolled_by_admin_id": "admin_uuid",
  "is_active": true
}
```

### 5. Bulk Enroll Users (Admin) ⭐ **USE THIS TO ONBOARD AGENTS**

**Endpoint:** `POST /referrals/programs/{program_id}/enroll/bulk`

**Request Body:**
```json
{
  "user_ids": [
    "user-uuid-1",
    "user-uuid-2",
    "user-uuid-3"
  ]
}
```

**Response:**
```json
{
  "message": "Enrolled 3 users successfully",
  "success": 3,
  "failed": 0
}
```

**Use Case: Enroll Field Agents**

```javascript
// Step 1: Get field officer program ID
GET /referrals/programs
// Find program with name "Field Officer Program"

// Step 2: Get list of users you want to enroll
GET /referrals/users
// Get user IDs for field officers

// Step 3: Bulk enroll them
POST /referrals/programs/{field_officer_program_id}/enroll/bulk
{
  "user_ids": ["uuid1", "uuid2", "uuid3"]
}
```

### 6. Unenroll User (Admin)

**Endpoint:** `DELETE /referrals/programs/{program_id}/enroll/{user_id}`

---

## VIEW USERS & CODES

### 7. List All Users with Codes (Admin) ⭐

**Endpoint:** `GET /referrals/users?limit=100&offset=0`

**Response:**
```json
[
  {
    "user_id": "uuid",
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com",
    "referral_code": "JOHN1234",
    "program_name": "Default Program",
    "total_referrals": 5,
    "successful_referrals": 3,
    "total_earned_tzs": 6000,
    "pending_rewards_tzs": 2000
  },
  {
    "user_id": "uuid2",
    "name": "Field Officer Mary",
    "phone": "+255723456789",
    "email": null,
    "referral_code": "FIELD5678",
    "program_name": "Field Officer Program",
    "total_referrals": 12,
    "successful_referrals": 10,
    "total_earned_tzs": 5000,
    "pending_rewards_tzs": 1000
  }
]
```

**Use in UI:**

Display this as a table:

| Name | Phone | Code | Program | Referrals | Earned | Pending |
|------|-------|------|---------|-----------|--------|---------|
| John Doe | ...5678 | JOHN1234 | Default | 5 (3 completed) | 6,000 TZS | 2,000 TZS |

### 8. Get One User's Details (Admin)

**Endpoint:** `GET /referrals/users/{user_id}`

**Response:**
```json
{
  "user_id": "uuid",
  "name": "John Doe",
  "phone": "+255712345678",
  "referral_code": "JOHN1234",
  "referred_by": [
    {
      "referrer_name": "Alice Smith",
      "referrer_code": "ALICE9999",
      "referred_at": "2026-11-01T...",
      "first_ride_completed": true
    }
  ],
  "referred_users": [
    {
      "referee_name": "Bob Jones",
      "referee_type": "rider",
      "referred_at": "2026-11-05T...",
      "first_ride_completed": true
    },
    {
      "referee_name": "Charlie Brown",
      "referee_type": "driver",
      "referred_at": "2026-11-07T...",
      "first_ride_completed": false
    }
  ],
  "rewards": [
    {
      "id": "uuid",
      "amount_tzs": 2000,
      "status": "paid",
      "trigger_event": "first_ride",
      "created_at": "2026-11-06T...",
      "paid_at": "2026-11-08T..."
    }
  ]
}
```

---

## VIEW RELATIONSHIPS

### 9. List All Referral Relationships (Admin)

**Endpoint:** `GET /referrals/relationships?limit=100&offset=0&status=completed`

**Query Params:**
- `status`: `completed`, `pending`, or omit for all

**Response:**
```json
[
  {
    "referral_id": "uuid",
    "referrer": {
      "name": "John Doe",
      "code": "JOHN1234"
    },
    "referee": {
      "name": "Jane Smith",
      "type": "rider"
    },
    "referred_at": "2026-11-05T...",
    "first_ride_completed": true,
    "rewards_paid": false,
    "program_name": "Default Program"
  }
]
```

**Use in UI:**

| Referrer | Code | → | Referee | Type | Status | Rewards Paid | Program |
|----------|------|---|---------|------|--------|--------------|---------|
| John Doe | JOHN1234 | → | Jane Smith | Rider | ✓ Completed | ✗ Pending | Default |

---

## STATS & PAYMENTS

### 10. Get Stats (Admin)

**Endpoint:** `GET /referrals/stats?period=month`

**Response:**
```json
{
  "total_referrals": 150,
  "successful_referrals": 120,
  "pending_referrals": 30,
  "total_rewards_paid": 240000.0,
  "total_rewards_pending": 60000.0,
  "top_referrer_count": 25
}
```

### 11. Get Top Referrers (Admin)

**Endpoint:** `GET /referrals/top-referrers?limit=10`

**Response:**
```json
[
  {
    "user_id": "uuid",
    "user_name": "Field Officer John",
    "referral_count": 25,
    "successful_count": 20,
    "total_earned": 10000.0
  }
]
```

### 12. Get Pending Payments (Admin)

**Endpoint:** `GET /referrals/payments/pending`

**Response:**
```json
[
  {
    "id": "payment_uuid",
    "referral_id": "uuid",
    "program_id": "uuid",
    "program_name": "Default Program",
    "user_id": "uuid",
    "user_name": "John Doe",
    "user_type": "referrer",
    "amount_tzs": 2000,
    "trigger_event": "first_ride",
    "created_at": "2026-11-08T..."
  }
]
```

### 13. Mark Payment as Paid (Admin)

**Endpoint:** `POST /referrals/payments/{payment_id}/pay`

**Request Body:**
```json
{
  "payment_id": "payment_uuid",
  "transaction_id": "transaction_uuid"  // optional
}
```

---

## USER ENDPOINTS

### 14. Get My Referral Code (Any User)

**Endpoint:** `GET /referrals/my-code`

**Response:**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "referral_code": "JOHN1234",
  "created_at": "2026-11-01T..."
}
```

### 15. Process Referral (Any User)

**Endpoint:** `POST /referrals/process`

**Request Body:**
```json
{
  "referral_code": "JOHN1234",
  "referee_id": "uuid",  // optional, defaults to current user
  "referee_type": "rider"  // or "driver"
}
```

---

## PROMOTIONS SYSTEM

### 16. Create Promotion (Admin)

**Endpoint:** `POST /promotions`

**Request Body:**
```json
{
  "code": "WELCOME2026",
  "name": "Welcome Promotion",
  "description": "20% off first 3 rides",
  "discount_type": "percentage",  // "percentage", "fixed", or "free_ride"
  "discount_value": 20.0,
  "max_discount_amount": 5000.0,  // cap for percentage
  "start_date": "2026-11-01T00:00:00Z",
  "end_date": "2026-12-31T23:59:59Z",
  "per_user_limit": 3,
  "total_uses_limit": 1000,
  "budget_cap_tzs": 1000000.0,
  "eligibility_criteria": {
    "new_users_only": true,
    "min_ride_amount": 5000,
    "ride_types": ["private", "duo"]
  },
  "is_active": true
}
```

### 17. List Promotions (Admin)

**Endpoint:** `GET /promotions?status=active`

### 18. Validate Promo Code (Any User)

**Endpoint:** `POST /promotions/validate`

**Request Body:**
```json
{
  "code": "WELCOME2026",
  "user_id": "uuid",
  "ride_amount": 10000.0
}
```

**Response:**
```json
{
  "valid": true,
  "discount_amount": 2000.0,
  "message": "Promo code is valid",
  "promotion_id": "uuid"
}
```

---

## COMPLETE WORKFLOWS

### WORKFLOW 1: Onboard Field Agents to Driver Referral Program

```javascript
// Step 1: Create Field Officer Program (ONCE, when setting up)
POST /referrals/programs
{
  "name": "Field Officer - Driver Onboarding",
  "description": "Field officers earn 500 TZS per driver they onboard",
  "is_default": false,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 500,
      "trigger": "onboarding_complete"  // Pay when driver finishes onboarding
    },
    "referee": null  // Drivers get nothing (they're just onboarding)
  },
  "target_referee_type": "driver",  // ONLY drivers count
  "priority": 10,  // Higher than default to override
  "is_active": true
}
// Save the returned program_id

// Step 2: Get list of all field officers/agents
GET /referrals/users?limit=100&offset=0
// Filter response to find your field officers (by name/phone/etc)
// Collect their user_ids: ["uuid1", "uuid2", "uuid3"]

// Step 3: Bulk enroll all field officers
POST /referrals/programs/{field_officer_program_id}/enroll/bulk
{
  "user_ids": ["uuid1", "uuid2", "uuid3", "..."]
}
// Response: {"message": "Enrolled 10 users successfully", "success": 10, "failed": 0}

// Step 4: Field officer shares their code (JOHN1234) with drivers
// When driver signs up and uses code JOHN1234:
POST /referrals/process
{
  "referral_code": "JOHN1234",
  "referee_type": "driver"
}

// Step 5: When driver completes onboarding, field officer gets 500 TZS
// Backend automatically creates payment record when onboarding_complete trigger fires
// View pending payments:
GET /referrals/payments/pending

// Step 6: Pay field officers
POST /referrals/payments/{payment_id}/pay
{
  "transaction_id": "mpesa_txn_123"  // optional
}
```

### WORKFLOW 2: Create Default Referral Program for All Users

```javascript
// This is what normal users get (rider refers rider, both get 2k)
POST /referrals/programs
{
  "name": "Default Referral Program",
  "description": "Both users earn 2000 TZS",
  "is_default": true,  // ⭐ AUTO-ENROLL all new users
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "first_ride"  // Referrer gets paid when referee completes first ride
    },
    "referee": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "signup"  // Referee gets paid immediately on signup
    }
  },
  "target_referee_type": null,  // Any user type (rider or driver)
  "priority": 0,  // Default priority
  "is_active": true
}

// That's it! New users are auto-enrolled.
// When user shares their code:
GET /referrals/my-code  // Returns: {"referral_code": "JOHN1234"}

// When someone uses their code:
POST /referrals/process
{
  "referral_code": "JOHN1234",
  "referee_type": "rider"
}
```

### WORKFLOW 3: View All Users and Their Codes (Admin Dashboard)

```javascript
// Get paginated list of all users
GET /referrals/users?limit=50&offset=0

// Response shows each user's referral activity:
[
  {
    "user_id": "uuid",
    "name": "John Doe",
    "phone": "+255712345678",
    "email": "john@example.com",
    "referral_code": "JOHN1234",  // ⭐ Their code
    "program_name": "Default Program",
    "total_referrals": 5,  // How many people they referred
    "successful_referrals": 3,  // How many completed first ride
    "total_earned_tzs": 6000,  // Already paid
    "pending_rewards_tzs": 2000  // Waiting to be paid
  }
]

// Get detailed info for one user:
GET /referrals/users/{user_id}

// See referral network:
GET /referrals/relationships?status=completed&limit=100
```

### WORKFLOW 4: Percentage-Based Rewards

```javascript
// Referee gets 2% of their first ride (capped at 5000 TZS)
POST /referrals/programs
{
  "name": "Percentage Reward Program",
  "is_default": false,
  "reward_config": {
    "referrer": {
      "type": "fixed",
      "amount": 2000,
      "trigger": "first_ride"
    },
    "referee": {
      "type": "percentage",
      "rate": 0.02,  // 2% = 0.02
      "trigger": "first_ride",
      "max_amount": 5000  // Cap at 5000 TZS
    }
  },
  "priority": 5,
  "is_active": true
}

// Example calculations:
// - First ride costs 50,000 TZS → Referee gets 1,000 TZS (2% of 50k)
// - First ride costs 500,000 TZS → Referee gets 5,000 TZS (capped at max_amount)
```

### WORKFLOW 5: Commission-Based Rewards (Ongoing)

```javascript
// Referrer gets 5% of EVERY ride referee takes for 90 days
POST /referrals/programs
{
  "name": "Commission Program",
  "is_default": false,
  "reward_config": {
    "referrer": {
      "type": "commission",
      "rate": 0.05,  // 5%
      "duration_days": 90,  // For 90 days
      "trigger": "signup"
    },
    "referee": null
  },
  "priority": 0,
  "is_active": true
}

// Backend calculates rewards on EACH ride the referee takes
// For 90 days after they signed up using referrer's code
```

---

## IMPORTANT NOTES FOR FRONTEND DEVELOPER

### 1. reward_config JSON Structure

The `reward_config` field is the MOST IMPORTANT part. Here's the template:

```typescript
interface RewardConfig {
  referrer?: {
    type: "fixed" | "percentage" | "commission";
    amount?: number;        // For type="fixed", amount in TZS
    rate?: number;          // For type="percentage" or "commission", decimal (0.02 = 2%)
    max_amount?: number;    // For type="percentage", cap in TZS
    duration_days?: number; // For type="commission", how long it lasts
    trigger: "signup" | "first_ride" | "onboarding_complete" | "document_verified";
  };
  referee?: {
    type: "fixed" | "percentage" | "commission";
    amount?: number;
    rate?: number;
    max_amount?: number;
    duration_days?: number;
    trigger: "signup" | "first_ride" | "onboarding_complete" | "document_verified";
  } | null;  // Can be null if referee gets nothing
}
```

### 2. Common Patterns

**Pattern 1: Both get fixed amount**
```json
{
  "referrer": {"type": "fixed", "amount": 2000, "trigger": "first_ride"},
  "referee": {"type": "fixed", "amount": 2000, "trigger": "signup"}
}
```

**Pattern 2: Only referrer gets reward**
```json
{
  "referrer": {"type": "fixed", "amount": 500, "trigger": "onboarding_complete"},
  "referee": null
}
```

**Pattern 3: Referee gets percentage**
```json
{
  "referrer": {"type": "fixed", "amount": 2000, "trigger": "first_ride"},
  "referee": {"type": "percentage", "rate": 0.02, "trigger": "first_ride", "max_amount": 5000}
}
```

### 3. Field Explanations

- **target_referee_type**: Filter who counts as a valid referral
  - `null` = Anyone (rider or driver)
  - `"rider"` = Only riders count
  - `"driver"` = Only drivers count (field officer use case)

- **priority**: When user is enrolled in multiple programs, highest wins
  - Default program: `priority: 0`
  - Field officer program: `priority: 10` (overrides default)

- **is_default**: Auto-enroll all new users?
  - `true` = Every new signup is auto-enrolled
  - `false` = Manual enrollment only (admin uses bulk enroll endpoint)

- **trigger**: When to pay the reward
  - `"signup"` = Immediately when referee registers
  - `"first_ride"` = When referee completes first ride (most common)
  - `"onboarding_complete"` = When referee finishes driver onboarding
  - `"document_verified"` = When referee's documents are verified

### 4. How Program Matching Works

When someone uses a referral code:

1. Backend finds the referrer (owner of code)
2. Checks which programs referrer is enrolled in
3. Picks HIGHEST PRIORITY program that matches referee type
4. Creates referral record with that program's rewards

Example:
- User is enrolled in "Default Program" (priority 0, any type)
- User is also enrolled in "Field Officer Program" (priority 10, driver only)
- When driver uses their code → Field Officer Program wins (higher priority + matches type)
- When rider uses their code → Default Program wins (Field Officer doesn't match rider type)

### 5. Testing Checklist

Before going live:

1. ✅ Create default program (is_default: true)
2. ✅ Create field officer program (driver only, higher priority)
3. ✅ Bulk enroll field officers
4. ✅ Test rider refers rider → both get default rewards
5. ✅ Test field officer refers driver → officer gets field officer reward
6. ✅ Verify pending payments show up correctly
7. ✅ Test mark payment as paid

### 6. UI Components Needed

**Program Manager:**
- Form to create/edit programs
- Dropdown for reward type (fixed/percentage/commission)
- Conditional fields based on type selected
- Priority number input
- Target referee type dropdown

**Users List:**
- Table showing all users with codes
- Search/filter by name, phone, program
- Click user → detailed view

**Bulk Enrollment:**
- Multi-select users from list
- Select program to enroll them in
- Bulk action button

**Relationships View:**
- Table or tree showing who referred who
- Filter by status (completed/pending)

**Payments:**
- Pending payments table
- Mark as paid button with optional transaction ID

---

## CURL EXAMPLES (For Testing Without UI)

```bash
# 1. Create default program
curl -X POST https://api.server.raut.app/referrals/programs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Default Program",
    "is_default": true,
    "reward_config": {
      "referrer": {"type": "fixed", "amount": 2000, "trigger": "first_ride"},
      "referee": {"type": "fixed", "amount": 2000, "trigger": "signup"}
    },
    "priority": 0,
    "is_active": true
  }'

# 2. List all users
curl https://api.server.raut.app/referrals/users?limit=10 \
  -H "Authorization: Bearer $TOKEN"

# 3. Bulk enroll users
curl -X POST https://api.server.raut.app/referrals/programs/{PROGRAM_ID}/enroll/bulk \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"user_ids": ["uuid1", "uuid2", "uuid3"]}'

# 4. View relationships
curl https://api.server.raut.app/referrals/relationships?status=completed \
  -H "Authorization: Bearer $TOKEN"

# 5. Get my code (any user)
curl https://api.server.raut.app/referrals/my-code \
  -H "Authorization: Bearer $TOKEN"

# 6. Process referral (use someone's code)
curl -X POST https://api.server.raut.app/referrals/process \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "referral_code": "JOHN1234",
    "referee_type": "rider"
  }'
```

---

## SUMMARY

✅ **Backend is complete** - All endpoints implemented  
✅ **Migrations are ready** - Database schema in place  
✅ **Referral codes auto-generate** - On signup (name-based: JOHN1234)  

**What frontend needs to build:**

1. **Admin Dashboard Pages:**
   - Programs manager (CRUD programs)
   - Users list (view all codes)
   - Bulk enrollment tool
   - Relationships/network view
   - Payments manager

2. **User Features:**
   - Show user their referral code
   - Input field to enter referral code on signup
   - Referral stats page (who they referred, earnings)

**Key Integration Points:**

- Signup flow: Call `POST /referrals/process` after user registers
- First ride completion: Backend auto-creates payments (no frontend work)
- Admin actions: Use bulk enroll endpoint to onboard field officers
- Display codes: Fetch from `GET /referrals/my-code`

**Frontend can start work NOW** - All backend APIs are live!
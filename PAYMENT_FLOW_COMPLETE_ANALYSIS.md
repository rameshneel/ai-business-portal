# 💳 Payment System - Complete Flow Analysis

## 🎯 Overview

Yeh ek **comprehensive payment system** hai jo **Stripe** ke saath integrate hai. System **two payment models** support karta hai:

1. **One-time Payment** (Payment Intent) - Subscription upgrade ke liye
2. **Recurring Subscription** (Stripe Subscription) - Monthly/Yearly billing

---

## 🏗️ Architecture & Components

### 📁 File Structure

```
nodejs-backend/src/
├── services/payment/
│   └── stripe.js                    # Stripe API wrapper (core service)
├── controllers/
│   └── payment.controller.js        # Payment endpoints handlers
├── models/
│   ├── payment.model.js             # Payment records
│   ├── subscription.model.js        # User subscriptions
│   └── subscriptionPlan.model.js    # Available plans
├── routes/
│   ├── payment.routes.js            # Payment API routes
│   └── subscription.routes.js       # Subscription management routes
└── validation/
    └── subscription.validation.js   # Input validation
```

---

## 🔄 Complete Payment Flow

### **Flow 1: One-Time Payment (Payment Intent) - Subscription Upgrade**

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐     ┌──────────┐
│  User   │────▶│ Frontend │────▶│ Backend │────▶│ Stripe │────▶│ Database │
└─────────┘     └──────────┘     └─────────┘     └────────┘     └──────────┘
     │                │                │              │                │
     │                │                │              │                │
     │  1. Select     │  2. POST       │  3. Create   │  4. Payment    │  5. Store
     │     Plan       │     /create-   │     Customer │     Intent     │     Record
     │                │     intent     │              │     Created    │
     │                │                │              │                │
     │  6. Enter      │  7. Stripe     │              │  8. Process    │
     │     Card       │     Elements   │              │     Payment    │
     │                │                │              │                │
     │  9. Confirm    │ 10. POST       │ 11. Verify   │ 12. Status:    │ 13. Update
     │     Payment    │     /confirm   │     Payment  │     succeeded  │     Subscription
```

#### Step-by-Step:

1. **User Selects Plan**

   - Frontend se plan select karta hai
   - `planId` aur `billingCycle` (monthly/yearly) send karta hai

2. **Create Payment Intent**

   ```
   POST /api/payment/create-intent
   Body: { planId, billingCycle }
   ```

   **Backend Process:**

   - ✅ User authentication check
   - ✅ Plan validation (ID ya type se find)
   - ✅ Stripe customer create/retrieve
   - ✅ Address handling (Indian regulations ke liye)
   - ✅ Amount calculation (monthly/yearly)
   - ✅ PaymentIntent create with metadata
   - ✅ Return `clientSecret` to frontend

3. **Frontend Payment Processing**

   - Stripe Elements use karke payment form
   - `clientSecret` se payment confirm
   - Card details securely Stripe ko directly

4. **Confirm Payment**

   ```
   POST /api/payment/confirm
   Body: { paymentIntentId, planId }
   ```

   **Backend Process:**

   - ✅ PaymentIntent status verify (`succeeded`)
   - ✅ Plan ID match verify (metadata se)
   - ✅ Customer ownership verify
   - ✅ Return confirmation

5. **Subscription Activation** (separate call)
   - Payment confirm ke baad subscription activate
   - User ko upgraded plan mil jata hai

---

### **Flow 2: Recurring Subscription (Stripe Subscription)**

```
┌─────────┐     ┌──────────┐     ┌─────────┐     ┌────────┐
│  User   │────▶│ Frontend │────▶│ Backend │────▶│ Stripe │
└─────────┘     └──────────┘     └─────────┘     └────────┘
     │                │                │              │
     │  1. Select     │  2. POST       │  3. Create   │  4. Subscription
     │     Plan       │     /subscription│  Customer  │     Created
     │                │     /create    │              │
     │                │                │              │
     │  5. Setup      │  6. Stripe     │              │  7. Payment
     │     Payment    │     Elements   │              │     Method
     │     Method     │                │              │     Attached
     │                │                │              │
     │                │                │              │  8. Webhook
     │                │                │◀─────────────│     Events
     │                │                │              │
     │                │                │  9. Update   │
     │                │                │     Status   │
     │                │                │              │
     │                │                │     ┌────────┴────────┐
     │                │                │     │   Database      │
     │                │                └────▶│   Updated       │
     │                │                      └─────────────────┘
```

#### Step-by-Step:

1. **Create Subscription**

   ```
   POST /api/payment/subscription/create
   Body: { planId, billingCycle }
   ```

   **Backend Process:**

   - ✅ User authentication
   - ✅ Plan validation
   - ✅ Stripe customer create/retrieve
   - ✅ Stripe Price ID get (monthly/yearly)
   - ✅ Stripe Subscription create
   - ✅ Database mein subscription record create (status: "pending")
   - ✅ Return `clientSecret` for payment setup

2. **Payment Setup** (Frontend)

   - Stripe Elements se payment method add
   - Subscription automatically activate ho jata hai

3. **Webhook Events** (Automatic)

   ```
   POST /api/payment/webhook
   ```

   **Handled Events:**

   **Subscription Events:**

   - `customer.subscription.created` → Status update, period dates
   - `customer.subscription.updated` → Status & period update, cancel flag
   - `customer.subscription.deleted` → Status: "cancelled"
   - `customer.subscription.trial_will_end` → Trial ending notification

   **Invoice Events:**

   - `invoice.created` → Invoice created (logging)
   - `invoice.finalized` → Invoice finalized (logging)
   - `invoice.payment_succeeded` → Status: "active", Payment record created/updated
   - `invoice.payment_failed` → Status: "past_due", Payment record with error details
   - `invoice.payment_action_required` → 3D Secure/action required notification

   **Payment Intent Events (One-time Payments):**

   - `payment_intent.succeeded` → Payment record created/updated with "completed" status
   - `payment_intent.payment_failed` → Payment record created/updated with "failed" status & error details

   **Charge Events:**

   - `charge.succeeded` → Charge succeeded (logging)
   - `charge.failed` → Charge failed (logging)

---

## 🛠️ Key Features & Updates

### ✅ **Recent Improvements**

1. **MongoDB ObjectId to String Conversion**

   ```javascript
   // Fixed: userId metadata issue
   const userIdString = userData.id?.toString() || String(userData.id || "");
   ```

   - Stripe metadata sirf strings accept karta hai
   - MongoDB ObjectId ko automatically string mein convert

2. **Indian Regulations Support**

   ```javascript
   // Address handling for export transactions
   customerData.address = {
     line1: userData.address.line1 || "Not provided",
     city: userData.address.city || "Not provided",
     postal_code: userData.address.postalCode || "000000",
     country: userData.address.country || "US",
   };
   ```

   - Billing address required for Indian Stripe accounts
   - Default address agar user ka address nahi hai

3. **Payment Intent Description**

   ```javascript
   // Required for Indian Stripe accounts
   const description = `Subscription upgrade to ${plan.displayName} Plan (${billingCycle})`;
   ```

   - Export transactions ke liye description required

4. **Flexible Plan Lookup**

   ```javascript
   // Plan find by ID or type
   if (mongoose.Types.ObjectId.isValid(planId)) {
     plan = await SubscriptionPlan.findById(planId);
   }
   if (!plan) {
     plan = await SubscriptionPlan.findOne({ type: planId, status: "active" });
   }
   ```

   - Plan ID (MongoDB ObjectId) ya plan type (string) dono accept
   - Better user experience

5. **Comprehensive Metadata**
   ```javascript
   metadata: {
     userId: userId.toString(),
     planId: plan._id.toString(),      // Actual MongoDB ID
     planType: plan.type,               // Plan type for reference
     originalPlanId: planId.toString(), // Original input
     billingCycle: billingCycle,
   }
   ```
   - Multiple identifiers for better tracking
   - Plan verification ke liye flexible

---

## 📊 Data Models

### **Payment Model**

```javascript
{
  userId: ObjectId,
  amount: Number,
  currency: String, // USD, EUR, GBP, INR
  status: String,   // pending, processing, completed, failed, cancelled, refunded
  stripe: {
    paymentIntentId: String,
    customerId: String,
    subscriptionId: String,
    invoiceId: String,
    chargeId: String,
  },
  paymentMethod: {
    type: String,    // card, bank_transfer, wallet, crypto
    last4: String,
    brand: String,
  },
  subscription: {
    plan: String,    // monthly, yearly, lifetime
    startDate: Date,
    endDate: Date,
    autoRenew: Boolean,
  },
  billing: {
    address: {...},
    tax: {...},
  }
}
```

### **Subscription Model**

```javascript
{
  userId: ObjectId,
  planId: ObjectId,              // Reference to SubscriptionPlan
  plan: String,                  // Legacy: free, basic, pro, enterprise
  status: String,                // active, inactive, cancelled, expired, pending
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  stripePriceId: String,
  billingCycle: String,          // monthly, yearly
  currentPeriodStart: Date,
  currentPeriodEnd: Date,
  cancelAtPeriodEnd: Boolean,
  amount: Number,
  currency: String,
  limits: {
    aiTextWriter: {...},
    aiImageGenerator: {...},
    aiSearch: {...},
    aiChatbot: {...},
  },
  features: {
    aiTextWriter: { enabled: Boolean },
    prioritySupport: Boolean,
    apiAccess: Boolean,
    // ... more features
  },
  usage: {
    wordsUsed: Number,
    imagesUsed: Number,
    // ... more usage tracking
    lastResetDate: Date,
  }
}
```

### **SubscriptionPlan Model**

```javascript
{
  name: String,                  // Unique plan name
  displayName: String,           // User-friendly name
  description: String,
  type: String,                  // free, basic, pro, enterprise
  price: {
    monthly: Number,
    yearly: Number,
    currency: String,            // USD, EUR, GBP, INR
  },
  features: {
    aiTextWriter: {
      wordsPerDay: Number,
      requestsPerDay: Number,
      enabled: Boolean,
    },
    // ... more services
  },
  stripe: {
    priceIdMonthly: String,      // Stripe Price ID
    priceIdYearly: String,
    productId: String,
  },
  status: String,                // active, inactive, archived
  displayOrder: Number,
  isPopular: Boolean,
}
```

---

## 🚀 API Endpoints

### **Payment Endpoints**

| Method | Endpoint                               | Auth         | Description                       |
| ------ | -------------------------------------- | ------------ | --------------------------------- |
| `POST` | `/api/payment/customer/create`         | ✅ JWT       | Create Stripe customer            |
| `POST` | `/api/payment/create-intent`           | ✅ JWT       | Create payment intent for upgrade |
| `POST` | `/api/payment/confirm`                 | ✅ JWT       | Confirm payment succeeded         |
| `POST` | `/api/payment/subscription/create`     | ✅ JWT       | Create recurring subscription     |
| `POST` | `/api/payment/subscription/cancel`     | ✅ JWT       | Cancel subscription               |
| `GET`  | `/api/payment/methods`                 | ✅ JWT       | Get payment methods               |
| `GET`  | `/api/payment/status/:paymentIntentId` | ✅ JWT       | Check payment status              |
| `POST` | `/api/payment/retry`                   | ✅ JWT       | Retry failed/canceled payment     |
| `POST` | `/api/payment/webhook`                 | 🔒 Signature | Stripe webhook handler            |

### **Subscription Endpoints**

| Method | Endpoint                    | Auth      | Description                     |
| ------ | --------------------------- | --------- | ------------------------------- |
| `GET`  | `/api/subscription/plans`   | ❌ Public | Get all available plans         |
| `GET`  | `/api/subscription/current` | ✅ JWT    | Get user's current subscription |
| `POST` | `/api/subscription/upgrade` | ✅ JWT    | Upgrade subscription            |
| `POST` | `/api/subscription/cancel`  | ✅ JWT    | Cancel subscription             |
| `GET`  | `/api/subscription/usage`   | ✅ JWT    | Get usage statistics            |
| `GET`  | `/api/subscription/status`  | ✅ JWT    | Get subscription status         |

---

## 🔐 Security Features

1. **JWT Authentication**

   - Sabhi payment endpoints protected
   - User identity verify

2. **Webhook Signature Verification**

   ```javascript
   const event = stripeClient.webhooks.constructEvent(
     payload,
     signature,
     process.env.STRIPE_WEBHOOK_SECRET
   );
   ```

   - Stripe webhook authenticity verify
   - Tampering prevention

3. **Customer Ownership Verification**

   ```javascript
   if (paymentIntent.customer !== user.stripeCustomerId) {
     throw new ApiError(403, "Payment intent does not belong to this user");
   }
   ```

   - User apne payment access kar sake
   - Unauthorized access prevent

4. **Plan ID Validation**
   - Multiple checks for plan matching
   - Metadata verification
   - Prevents plan manipulation

---

## 💡 Best Practices Implemented

### ✅ **Error Handling**

- Comprehensive try-catch blocks
- Meaningful error messages
- Proper error propagation

### ✅ **Data Validation**

- Input validation middleware
- Plan existence checks
- Amount validation

### ✅ **Code Organization**

- Service layer separation (stripe.js)
- Controller layer (payment.controller.js)
- Model layer (MongoDB schemas)

### ✅ **Lazy Loading**

- Stripe client lazy initialization
- Reduces startup time
- Better resource management

### ✅ **Metadata Tracking**

- Comprehensive metadata in PaymentIntent
- Multiple identifiers for flexibility
- Better debugging and tracking

### ✅ **Address Handling**

- Indian regulations compliance
- Default address fallback
- Address update support

### ✅ **Flexible Plan Lookup**

- Support for both ID and type
- Better user experience
- Backward compatibility

---

## 🔄 Webhook Flow

```
Stripe Event → Webhook Endpoint → Event Handler → Database Update
```

### **Event Handlers:**

**Subscription Events:**

1. **`customer.subscription.created`**

   - Subscription status update
   - Period dates set (start & end)

2. **`customer.subscription.updated`**

   - Status update
   - Period dates update
   - Cancel flag update (`cancelAtPeriodEnd`)

3. **`customer.subscription.deleted`**

   - Status: "cancelled"
   - Subscription end

4. **`customer.subscription.trial_will_end`**
   - Trial ending notification
   - Can trigger email/push notifications

**Invoice Events:**

5. **`invoice.created`**

   - Invoice created (logging)
   - Pre-payment notification trigger

6. **`invoice.finalized`**

   - Invoice finalized (logging)
   - Payment reminder trigger

7. **`invoice.payment_succeeded`**

   - Subscription status: "active"
   - **Payment record created/updated** with:
     - Invoice details
     - Payment method details (card last4, brand, expiry)
     - Subscription details
     - Amount, currency, status

8. **`invoice.payment_failed`**

   - Subscription status: "past_due"
   - **Payment record created/updated** with:
     - Error details (code, message, decline_code)
     - Failed payment information

9. **`invoice.payment_action_required`**
   - 3D Secure/action required notification
   - User notification trigger

**Payment Intent Events (One-time Payments):**

10. **`payment_intent.succeeded`**

    - **Payment record created/updated** with:
      - Payment Intent ID
      - Payment method details
      - Amount, currency, status: "completed"
      - Charge ID

11. **`payment_intent.payment_failed`**
    - **Payment record created/updated** with:
      - Error details (code, message, decline_code)
      - Status: "failed"

**Charge Events:**

13. **`charge.succeeded`**

    - Charge succeeded (logging)
    - Additional notification trigger

14. **`charge.failed`**
    - Charge failed (logging)
    - Additional notification trigger

---

## 📈 Usage Tracking

Subscription model mein comprehensive usage tracking:

```javascript
usage: {
  wordsUsed: Number,
  imagesUsed: Number,
  minutesUsed: Number,
  charactersUsed: Number,
  pagesUsed: Number,
  chatbotsUsed: Number,
  voiceClonesUsed: Number,
  lastResetDate: Date,
}
```

- Daily usage tracking
- Automatic reset on period end
- Limit enforcement

---

## 🎨 Frontend Integration

### **Payment Intent Flow:**

```javascript
// 1. Create Payment Intent
const response = await fetch("/api/payment/create-intent", {
  method: "POST",
  body: JSON.stringify({ planId, billingCycle }),
  headers: { Authorization: `Bearer ${token}` },
});
const { clientSecret } = await response.json();

// 2. Confirm Payment (Stripe Elements)
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: { card: cardElement },
});

// 3. Confirm on Backend
await fetch("/api/payment/confirm", {
  method: "POST",
  body: JSON.stringify({
    paymentIntentId: paymentIntent.id,
    planId,
  }),
});
```

---

## 🐛 Recent Fixes

1. ✅ **MongoDB ObjectId to String** - Stripe metadata fix
2. ✅ **Address Handling** - Indian regulations support
3. ✅ **Payment Intent Description** - Export transaction requirement
4. ✅ **Flexible Plan Lookup** - ID ya type se plan find
5. ✅ **Comprehensive Metadata** - Better tracking and verification
6. ✅ **Webhook Raw Body Handling** - Stripe signature verification ke liye raw body buffer support
7. ✅ **Comprehensive Webhook Events** - All important Stripe events handled (14 events)
8. ✅ **Payment Records Management** - Automatic Payment record creation/update from webhooks
9. ✅ **Payment Method Details** - Card details (last4, brand, expiry) automatically captured
10. ✅ **Error Details Storage** - Payment failure errors stored with code, message, and decline_code
11. ✅ **Payment Tracking** - Payment record created immediately on Payment Intent creation (status: "pending")
12. ✅ **Payment Status Check** - Endpoint to check payment status and sync with Stripe
13. ✅ **Payment Retry** - Retry failed/canceled payments with new Payment Intent
14. ✅ **Payment Canceled Handling** - Webhook handler for canceled payments

---

## 🚦 Status Flow

### **Payment Status:**

```
pending → processing → completed
                ↓
            failed/cancelled/refunded
```

### **Subscription Status:**

```
pending → active → cancelled/expired
            ↓
        past_due (payment failed)
```

---

## 📋 Default Plans

System startup par **4 default plans** automatically create hote hain:

### **1. Free Plan** (Always Free)

- **Price**: $0/month, $0/year
- **Features**:
  - AI Text Writer: 500 words/day, 10 requests/day
  - AI Image Generator: 3 images/day, 3 requests/day
  - AI Search: 10 searches/day
  - AI Chatbot: 1 chatbot, 20 messages/day
  - Basic support

### **2. Basic Plan** ($9.99/month)

- **Features**:
  - AI Text Writer: 5,000 words/day, 50 requests/day
  - AI Image Generator: 20 images/day, 20 requests/day
  - AI Search: 50 searches/day
  - AI Chatbot: 3 chatbots, 100 messages/day
  - Priority support

### **3. Pro Plan** ($29.99/month)

- **Features**:
  - AI Text Writer: 25,000 words/day, 200 requests/day
  - AI Image Generator: 100 images/day, 100 requests/day
  - AI Search: 200 searches/day
  - AI Chatbot: 10 chatbots, 500 messages/day
  - Priority support + API access

### **4. Enterprise Plan** ($99.99/month)

- **Features**:
  - **Unlimited** everything
  - All features enabled
  - Custom branding
  - Analytics
  - Premium support

**Note**: Plans automatically initialize on server startup via `planInitializer.js`

---

## 🔧 Environment Variables

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...        # Webhook signature secret
STRIPE_PUBLISHABLE_KEY=pk_test_...     # Frontend ke liye (optional)
```

---

## 📝 Notes

- **Stripe Test Mode**: Use test keys for development
- **Webhook Setup**: Stripe Dashboard mein webhook URL configure karein
- **Currency Support**: USD, EUR, GBP, INR supported
- **Billing Cycles**: Monthly aur Yearly supported
- **Free Plan**: Auto-created for new users
- **Address Required**: Indian Stripe accounts ke liye mandatory
- **Plan Initialization**: Server startup par automatically

---

## 🎯 Summary

Yeh ek **production-ready payment system** hai jo:

- ✅ Secure payment processing
- ✅ Flexible subscription management
- ✅ Comprehensive error handling
- ✅ Indian regulations compliance
- ✅ Real-time webhook updates
- ✅ Usage tracking
- ✅ Multiple payment methods support
- ✅ Automatic plan initialization
- ✅ Flexible plan lookup (ID or type)
- ✅ Comprehensive metadata tracking

**Cool mindset ke saath build kiya gaya hai!** 🚀

---

## 🔍 Quick Reference

### **Payment Flow Decision Tree:**

```
User wants to upgrade
    ↓
One-time Payment? → Payment Intent Flow
    ↓
Recurring Subscription? → Stripe Subscription Flow
    ↓
Free Plan? → Auto-assign (no payment)
```

### **Key Functions:**

1. **`createCustomer()`** - Stripe customer create/retrieve
2. **`createPaymentIntent()`** - One-time payment setup
3. **`createSubscription()`** - Recurring subscription setup
4. **`handleWebhook()`** - Stripe events handle
5. **`confirmPaymentController()`** - Payment verification

### **Important Validations:**

- ✅ User authentication (JWT)
- ✅ Plan existence check
- ✅ Amount validation
- ✅ Customer ownership
- ✅ Payment status verification
- ✅ Plan ID matching

---

## 🛡️ Network Issues & Incomplete Payments Handling

### **Problem Scenarios:**

1. **Network Issue During Payment**

   - User payment kar raha hai, network disconnect ho gaya
   - Payment Intent Stripe mein pending rahega
   - **Solution:** Payment record immediately create hota hai (status: "pending")
   - User `GET /api/payment/status/:paymentIntentId` se status check kar sakta hai

2. **Payment Abandoned**

   - User payment form bich mein chhod diya
   - Payment Intent 24 hours baad expire ho jayega
   - **Solution:** Payment record track karta hai, user retry kar sakta hai

3. **Payment Processing Timeout**
   - Payment processing mein network issue
   - Status unclear
   - **Solution:** Status check endpoint se real-time status milta hai

### **How It Works:**

1. **Payment Intent Creation:**

   ```
   User → Create Payment Intent
   → Payment Intent created in Stripe
   → Payment record created in DB (status: "pending") ✅
   → Return clientSecret + paymentId
   ```

2. **Network Issue Scenario:**

   ```
   User → Payment processing...
   → Network issue ❌
   → Payment Intent still in Stripe (status: "requires_payment_method")
   → Payment record in DB (status: "pending")
   → User can check status: GET /api/payment/status/:paymentIntentId
   → User can retry: POST /api/payment/retry
   ```

3. **Payment Abandoned:**
   ```
   User → Payment form open
   → User closes page ❌
   → Payment Intent expires after 24h
   → Webhook: payment_intent.canceled
   → Payment record updated (status: "cancelled")
   → User can retry with same details
   ```

### **New Endpoints:**

1. **Check Payment Status:**

   ```
   GET /api/payment/status/:paymentIntentId
   ```

   - Returns Stripe status + DB status
   - Auto-syncs if different
   - Shows error details if failed
   - Shows next action if required (3D Secure)

2. **Retry Payment:**
   ```
   POST /api/payment/retry
   Body: { paymentIntentId }
   ```
   - Creates new Payment Intent with same details
   - Updates existing Payment record
   - Returns new clientSecret

### **Webhook Coverage:**

- ✅ `payment_intent.succeeded` → Status: "completed"
- ✅ `payment_intent.payment_failed` → Status: "failed" + error details
- ✅ `payment_intent.canceled` → Status: "cancelled"
- ✅ `payment_intent.processing` → Status: "processing" (via status check)

### **Benefits:**

1. ✅ **Complete Tracking** - Har payment track hota hai from creation
2. ✅ **Status Visibility** - User apna payment status check kar sakta hai
3. ✅ **Recovery** - Failed/canceled payments retry kar sakte hain
4. ✅ **No Lost Payments** - Network issues se payment lose nahi hota
5. ✅ **Real-time Sync** - Status check endpoint automatically sync karta hai

---

**End of Analysis** 🎉

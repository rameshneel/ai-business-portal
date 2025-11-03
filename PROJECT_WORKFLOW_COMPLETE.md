# 🎯 **AI BUSINESS PORTAL - COMPLETE WORKFLOW**

## 📋 **PHASE OVERVIEW:**

### **Phase 1**: Core Backend (unicornAuth, Models, Middleware)

### **Phase 2**: AI Text Writer + Socket.IO

### **Phase 2.5**: Business Model (Subscription, Payment, Analytics)

### **Status**: ✅ All phases complete

---

## 🔄 **COMPLETE USER FLOW:**

### **1️⃣ USER REGISTRATION & AUTHENTICATION**

```
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "password": "Password123!"
}

Response:
{
  "user": {
    "id": "...",
    "email": "john@example.com",
    "subscription": "free"
  }
}
```

**What Happens:**

- User created in database
- Password hashed with bcrypt
- Default **Free Plan** subscription auto-assigned
- User gets 500 words/day, 3 images/month, 10 searches/day
- JWT tokens generated (access + refresh)

---

### **2️⃣ USER LOGIN**

```
POST /api/auth/login
{
  "email": "john@example.com",
 بر"password": "Password123!"
}

Response:
{
  "user": { ... },
  "accessToken": "jwt_token_here",
  "refreshToken": "refresh_token_here"
}
```

**What Happens:**

- Credentials verified
- JWT tokens generated
- Cookies set (HTTP-only, secure)
- User session established

---

### **3️⃣ VIEW SUBSCRIPTION PLANS**

```
GET /api/subscription/plans

Response:
{
  "plans": [
    {
      "name": "free",
      "displayName": "Free Plan",
      "price": { "monthly": 0, "currency": "USD" },
      "features": {
        "aiTextWriter": { "wordsPerDay": 500, "enabled": true },
        "aiImageGenerator": { "imagesPerDay": 3, "enabled": true },
        "aiSearch": { "searchesPerDay": 10, "enabled": true }
      }
    },
    {
      "name": "basic",
      "price": { "monthly": 9.99, "currency": "USD" },
      "isPopular": true,
      ...
    },
    {
      "name": "pro",
      "price": { "monthly": 29.99, "currency": "USD" },
      ...
    },
    {
      "name": "enterprise",
      "price": { "monthly": 99.99, "currency": "USD" },
      ...
    }
  ]
}
```

**What Happens:**

- All 4 plans displayed
- Features and limits shown
- USD pricing displayed
- Popular plan highlighted

---

### **4️⃣ USE AI TEXT WRITER (Free Plan)**

#### **Option 1: Regular Generation**

```
POST /api/services/text/generate
Authorization: Bearer <token>

{
  "prompt": "Write a blog post about AI",
  "contentType": "blog_post",
  "tone": "professional",
  "length": "medium"
}

Response: Complete text in one response
```

#### **Option 2: Streaming Generation (Real-time)**

```
POST /api/services/text/generate-stream
Authorization: Bearer <token>

Response (Server-Sent Events):
data: {"chunk":"The","partial":"The"}
data: {"chunk":" future","partial":"The future"}
...
data: {"done":true,"fullText":"...","wordsGenerated":250}
```

**What Happens:**

1. **Validation**: Check prompt, contentType valid
2. **Authentication**: JWT token verified
3. **Subscription Check**: Get user's subscription (Free plan)
4. **Usage Check**: Calculate today's word usage (250 words used)
5. **Limit Check**: Compare with plan limit (500 words/day limit)
6. **OpenAI API Call**: Send to OpenAI GPT-3.5-turbo (streaming enabled)
7. **Real-time Streaming**: Yield chunks as they arrive
8. **Track Usage**: Save usage record to ServiceUsage model
9. **Socket.IO Events**: Emit "ai_text_generation_start" and "ai_service_complete"
10. **Response**: Stream text chunks in real-time

**Real-time Updates:**

- Streaming text chunks as they're generated
- Socket.IO events for progress tracking
- Usage warnings at 80% threshold
- Live usage updates

---

### **5️⃣ CHECK SUBSCRIPTION USAGE**

```
GET /api/subscription/usage?startDate=2025-01-01&endDate=2025-12-31
Authorization: Bearer <token>

Response:
{
  "today": {
    "wordsUsed": 250,
    "requests": 3,
    "maxWords": 500,
    "remainingWords": 250
  },
  "thisMonth": {
    "wordsUsed": 5000,
    "requests": 50
  }
}
```

**What Happens:**

- Query ServiceUsage collection
- Aggregate daily and monthly usage
- Compare with subscription limits
- Return usage statistics

---

### **6️⃣ UPGRADE TO PAID PLAN (Basic)**

```
POST /api/subscription/upgrade
Authorization: Bearer <token>

{
  "planId": "<basic_plan_id>",
  "billingCycle": "monthly"
}

Response:
{
  "subscription": {
    "plan": "basic",
    "status": "active",
    "amount": 9.99,
    "currency": "USD",
    "currentPeriodStart": "...",
    "currentPeriodEnd": "..." // +1 month
  }
}
```

**What Happens:**

1. **Validation**: Check plan exists and is valid
2. **Stripe Payment**: Create payment intent for $9.99
3. **Subscription Creation**: Create new subscription record
4. **User Update**: Link subscription to user
5. **Socket.IO Event**: Emit "subscription_upgraded"
6. **Usage Reset**: User now has 10,000 words/day limit
7. **Response**: Return subscription details

---

### **7️⃣ PAYMENT FLOW (Stripe Integration)**

```
POST /api/payment/create-intent
Authorization: Bearer <token>

{
  "planId": "<plan_id>",
  "billingCycle": "monthly"
}

Response:
{
  "clientSecret": "pi_xxx_secret_xxx",
  "amount": 999, // cents
  "currency": "USD"
}
```

**What Happens:**

1. **Stripe Customer**: Create/get Stripe customer
2. **Payment Intent**: Create payment intent
3. **Webhook Setup**: Register webhook for payment confirmation
4. **Response**: Return client secret for frontend

**Frontend Flow:**

- User enters card details
- Stripe.js handles secure payment
- Payment confirmed via webhook
- Subscription activated

---

### **8️⃣ REAL-TIME UPDATES (Socket.IO)**

```
Socket.IO Connection:
ws://localhost:5000

Events:
- subscription_status_update
- usage_warning (at 80% threshold)
- ai_text_generation_start
- ai_service_complete
- subscription_upgraded
```

**What Happens:**

- User connects via Socket.IO
- Authenticated with JWT
- Real-time events sent during usage
- Live usage warnings
- Subscription updates

---

### **9️⃣ ANALYTICS (Admin)**

```
GET /api/analytics/subscriptions
Authorization: Bearer <admin_token>

Response:
{
  "subscriptions": {
    "total": 1000,
    "active": 800,
    "cancelled": 50,
    "activeRate": 80%
  },
  "planDistribution": {
    "free": 600,
    "basic": 300,
    "pro": 80,
    "enterprise": 20
  }
}
```

**What Happens:**

- Aggregate subscription data
- Calculate metrics
- Plan distribution analysis
- Return analytics for dashboard

---

## 🔐 **AUTHENTICATION & AUTHORIZATION FLOW:**

```
Request → verifyJWT Middleware → Controller → Service → Database
```

### **Middleware Chain:**

1. **verifyJWT**: Verify JWT token from header
2. **adminOnly**: Check if user is admin (optional)
3. **checkSubscriptionStatus**: Verify active subscription (optional)
4. **checkServiceAccess**: Verify service access (optional)

### **Role-Based Access:**

- **Customer**: Can access all services within limits
- **Admin**: Can access analytics and admin endpoints

---

## 📊 **DATABASE SCHEMA:**

### **Collections:**

1. **users** - User accounts, authentication
2. **subscriptions** - User subscription details
3. **subscriptionplans** - Available plans (Free, Basic, Pro, Enterprise)
4. **serviceusages** - AI service usage tracking
5. **services** - AI services configuration
6. **payments** - Payment history (Stripe integration)

---

## 🎯 **COMPLETE FLOW DIAGRAM:**

```
Registration → Login → Free Plan (auto-assigned)
    ↓
Use AI Text Writer (500 words/day limit)
    ↓
Check Usage → Near Limit (80%) → Usage Warning
    ↓
View Plans → Upgrade to Basic ($9.99)
    ↓
Stripe Payment → Subscription Active
    ↓
10,000 words/day limit → Use more AI services
    ↓
Analytics → Track usage and subscription metrics
```

---

## ✅ **FEATURES COMPLETE:**

### **Phase 1: Core Backend**

- ✅ User registration & authentication
- ✅ JWT token management
- ✅ Role-based access control
- ✅ Error handling middleware
- ✅ Input validation

### **Phase 2: AI Text Writer**

- ✅ OpenAI GPT-4 integration
- ✅ Text generation with parameters
- ✅ Usage tracking
- ✅ Limit enforcement
- ✅ Socket.IO real-time updates

### **Phase 2.5: Business Model**

- ✅ Subscription management (4 plans)
- ✅ Stripe payment integration
- ✅ Usage analytics
- ✅ Revenue tracking
- ✅ Subscription metrics

---

## 🎉 **RESULT:**

**Complete AI Business Portal with:**

- ✅ Free + Paid pricing model
- ✅ Real-time updates
- ✅ Usage tracking
- ✅ Payment integration
- ✅ Analytics dashboard

**Status**: ✅ **Production Ready!**

---

**Last Updated**: October 27, 2025

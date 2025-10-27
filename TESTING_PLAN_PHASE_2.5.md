# 🧪 **TESTING PLAN - PHASE 2.5**

## 🎯 **OVERVIEW**

Phase 1, Phase 2, और Phase 2.5 को **Postman से test करने** का complete plan।

---

## 📋 **TESTING SEQUENCE**

### **🔹 STEP 1: Setup (5 minutes)**

1. **Postman में Collection Import करें:**

   - Phase 2 collection import करें (already exists)
   - Subscription, Payment, Analytics endpoints manually add करें (guide मिलेगी `POSTMAN_COLLECTION_PHASE_2.5_ADDON.md` में)

2. **Server Start करें:**

   ```bash
   npm run dev
   ```

3. **Environment Variables Check करें:**
   - MongoDB running ✅
   - .env file complete ✅

---

### **🔹 STEP 2: Authentication Testing (10 minutes)**

#### **2.1 User Registration**

- ✅ Strong password validation (uppercase, lowercase, number, special char)
- ✅ Email uniqueness check
- ✅ Default subscription assignment (Free plan)

#### **2.2 User Login**

- ✅ Token automatic save (accessToken, refreshToken, userId)
- ✅ Cookie-based authentication
- ✅ JWT validation

#### **2.3 Token Management**

- ✅ Refresh token functionality
- ✅ Token expiration handling
- ✅ Logout functionality

---

### **🔹 STEP 3: Subscription Management (15 minutes)**

#### **3.1 Get All Subscription Plans (Public)**

- ✅ 5 plans दिखें (Free, Trial, Basic, Pro, Enterprise)
- ✅ PlanId automatically save हो
- ✅ Features और limits display

#### **3.2 Start Free Trial**

- ✅ 7-day trial start हो
- ✅ Usage limits activate हो
- ✅ Socket.IO trial_started event emit हो
- ✅ Subscription record create हो

#### **3.3 Get Current Subscription**

- ✅ User's active subscription display हो
- ✅ Trial details (remaining days, limits)
- ✅ Usage statistics

#### **3.4 ● Trial Subscription Status**

- ✅ Trial expiration check
- ✅ Real-time status updates
- ✅ Usage limit warnings

---

### **🔹 STEP 4: AI Text Writer Service (20 minutes)**

#### **4.1 Get Service Options**

- ✅ Content types list
- ✅ Available tones
- ✅ Length options

#### **4.2 Generate Text (Blog Post)**

- ✅ Text generation हो
- ✅ Mock service fallback (if OpenAI quota exceeded)
- ✅ Usage tracking हो
- ✅ Words generated count हो
- ✅ Socket.IO events emit हो

#### **4.3 Generate Text (Multiple Types)**

- ✅ Social media content
- ✅ Email writing
- ✅ Product description
- ✅ Ad copy
- ✅ General content

#### **4.4 Get Usage Statistics**

- ✅ Today's usage
- ✅ Remaining limits
- ✅ Usage percentage
- ✅ Warning at 80% threshold

#### **4.5 Get Text History**

- ✅ Generation history
- ✅ Pagination
- ✅ Success/failure tracking

---

### **🔹 STEP 5: Usage Limit Testing (10 minutes)**

#### **5.1 Trial Limits Enforcement**

- ✅ Daily word limit check
- ✅ Block exceeding limit
- ✅ Usage warning at 80%

#### **5.2 Usage Tracking Accuracy**

- ✅ Words count correctly
- ✅ Daily reset functionality
- ✅ Different content types count

---

### **🔹 STEP 6: Socket.IO Real-time Features (15 minutes)**

#### **6.1 Socket Connection**

- ✅ WebSocket connection establish हो
- ✅ JWT authentication working
- ✅ Connection events

#### **6.2 Real-time Notifications**

- ✅ Trial start notification
- ✅ Usage warning notification
- ✅ AI service complete notification

#### **6.3 User Presence**

- ✅ Online/offline status
- ✅ Connected users list

---

### **🔹 STEP 7: Payment Integration (15 minutes)** ⚠️

#### **7.1 Stripe Customer Creation**

- ✅ Customer create हो
- ✅ Stripe customer ID save हो

#### **7.2 Stripe Subscription** (Test Mode)

- ✅ Subscription create हो
- ✅ Payment intent receive हो
- ✅ Webhook handling

**Note:** Stripe test mode में fully test नहीं हो सकता without Stripe account setup

---

### **🔹 STEP 8: Analytics (Admin Only) (15 minutes)**

#### **8.1 Dashboard Data**

- ✅ Complete analytics
- ✅ All metrics display
- ✅ Real-time data

#### **8.2 Subscription Metrics**

- ✅ Total subscriptions
- ✅ Active rate
- ✅ Trial metrics

#### **8.3 Revenue Metrics**

- ✅ Total revenue
- ✅ Period-based analytics
- ✅ Subscription count

#### **8.4 Usage Analytics**

- ✅ Service-wise usage
- ✅ Success rate
- ✅ Average response time

#### **8.5 User Engagement**

- ✅ Total users
- ✅ Active users
- ✅ Engagement rate

#### **8.6 Churn Analysis**

- ✅ Churned users
- ✅ Churn rate
- ✅ 30-day analysis

#### **8.7 Trial Conversion Funnel**

- ✅ Total trials
- ✅ Conversion rate
- ✅ Expiration rate

---

### **🔹 STEP 9: Admin Routes (10 minutes)**

#### **9.1 Get All Users**

- ✅ User list
- ✅ Pagination
- ✅ Search functionality
- ✅ Role filtering

#### **9.2 User Management**

- ✅ User status update
- ✅ Role assignment
- ✅ User details

---

### **🔹 STEP 10: Error Handling (5 minutes)**

#### **10.1 Invalid Token**

- ✅ 401 Unauthorized
- ✅ Proper error message

#### **10.2 Validation Errors**

- ✅ Password validation
- ✅ Email validation
- ✅ Input validation

#### **10.3 Limit Exceeded**

- ✅ 403 Forbidden
- ✅ Usage limit message
- ✅ Upgrade prompt

---

## ✅ **SUCCESS CRITERIA**

### **Functional:**

- ✅ All endpoints working
- ✅ Authentication complete
- ✅ Trial start successful
- ✅ Usage limits enforced
- ✅ Real-time notifications working
- ✅ Analytics data accessible

### **Quality:**

- ✅ No critical errors
- ✅ Proper error messages
- ✅ Consistent API responses
- ✅ Fast response times
- ✅ Database queries optimized

### **Business Logic:**

- ✅ Subscription management working
- ✅ Trial conversion flow correct
- ✅ Usage tracking accurate
- ✅ Limits enforced properly
- ✅ Real-time updates functional

---

## 📊 **TESTING CHECKLIST**

### **Phase 1 (Core Backend):**

- [ ] User Registration
- [ ] User Login
- [ ] Profile Management
- [ ] Password Change
- [ ] Token Refresh
- [ ] Admin User Management

### **Phase 2 (AI Text Writer + Socket.IO):**

- [ ] Service Options
- [ ] Text Generation (all types)
- [ ] Usage Statistics
- [ ] Text History
- [ ] Socket.IO Connection
- [ ] Real-time Notifications
- [ ] User Presence

### **Phase 2.5 (Business Model):**

- [ ] Get Subscription Plans
- [ ] Start Trial
- [ ] Get Current Subscription
- [ ] Check Trial Expiration
- [ ] Get Subscription Usage
- [ ] Subscription Status
- [ ] Payment Integration (basic)
- [ ] Analytics Dashboard
- [ ] Subscription Metrics
- [ ] Revenue Metrics
- [ ] Usage Analytics
- [ ] User Engagement
- [ ] Churn Analysis
- [ ] Conversion Funnel

---

## 🎯 **EXPECTED RESULTS**

### **Successful Response Examples:**

#### **Trial Start:**

```json
{
  "statusCode": 201,
  "data": {
    "trial": {
      "id": "...",
      "startTime": "2025-10-17T...",
      "endTime": "2025-10-24T...",
      "status": "active",
      "remainingDays": 7
    }
  },
  "success": true
}
```

#### **AI Text Generation:**

```json
{
  "statusCode": 200,
  "data": {
    "generatedText": "...",
    "wordsGenerated": 250,
    "usage": {
      "wordsUsedToday": 250,
      "maxWords": 1000,
      "remainingWords": 750
    }
  },
  "success": true
}
```

#### **Usage Warning (80%):**

```json
Socket.IO Event: "usage_warning"
{
  "service": "ai_text_writer",
  "usage": {
    "used": 800,
    "limit": 1000,
    "percentage": 80
  },
  "message": "⚠️ You've used 80% of your daily limit!",
  "timestamp": "2025-10-17T..."
}
```

---

## ⚠️ **KNOWN LIMITATIONS**

### **Stripe Testing:**

- Full payment testing requires Stripe account setup
- Test mode में partially test हो सकता है
- Webhook testing requires ngrok or similar

### **Socket.IO Testing:**

- Postman में limited support
- Dedicated Socket.IO client बेहतर है real-time testing के लिए
- Events manual check करने होंगे

---

## 🚀 **NEXT STEPS**

After successful testing:

1. **Bug Fixes:** किसी भी issue को fix करें
2. **Documentation:** API documentation update करें
3. **Phase 3:** AI Image Generator implementation start करें
4. **Frontend:** Frontend integration planning

---

## 📝 **TESTING REPORT TEMPLATE**

Test Date: **\*\***\_\_\_**\*\***
Tester: **\*\***\_\_\_**\*\***

### **Results:**

| Feature            | Status | Notes   |
| ------------------ | ------ | ------- |
| Authentication     | ✅/❌  |         |
| Subscription Plans | ✅/❌  |         |
| Trial Start        | ✅/❌  |         |
| AI Text Generation | ✅/❌  |         |
| Usage Limits       | ✅/❌  |         |
| Socket.IO          | ✅/❌  |         |
| Analytics          | ✅/❌  |         |
| Payment            | ⚠️/❌  | Limited |

### **Issues Found:**

1. ***
2. ***

### **Recommendations:**

1. ***
2. ***

---

## 🎉 **READY TO TEST!**

**Complete Phase 1, 2, 2.5 को comprehensive testing के साथ validate करें!**

**Testing करके बताइए: Sab kuch working है या कोई issues हैं!** 🚀

---

_Created: October 17, 2025_
_Status: Ready for Testing_

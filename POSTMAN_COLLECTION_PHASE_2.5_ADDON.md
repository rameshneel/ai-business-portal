# 📬 **POSTMAN COLLECTION - PHASE 2.5 ADDON**

## 🎯 **OVERVIEW**

Phase 2.5 में **Subscription Management, Payment Integration, और Analytics** endpoints add हुए हैं।

आपको Phase 2 की existing collection में ये endpoints manually add करने होंगे:

---

## 📋 **NEW ENDPOINTS TO ADD:**

### **🔹 1. Subscription Management Folder** 💳

```
Folder: "Subscription Management"
Base URL: {{baseUrl}}/subscription
```

#### **Endpoints:**

1. **Get All Subscription Plans** (Public)

   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/plans`
   - Auth: None required
   - **Test Script** (to save planId):

   ```javascript
   if (pm.response.code === 200) {
     const response = pm.response.json();
     if (
       response.data &&
       response.data.plans &&
       response.data.plans.length > 0
     ) {
       const trialPlan = response.data.plans.find((p) => p.type === "trial");
       if (trialPlan) {
         pm.collectionVariables.set("planId", trialPlan.id);
       }
     }
   }
   ```

2. **Get Current Subscription**

   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/current`
   - Auth: Bearer {{accessToken}}

3. **Start Free Trial**

   - Method: `POST`
   - URL: `{{baseUrl}}/subscription/trial/start`
   - Auth: Bearer {{accessToken}}
   - Body: None

4. **Upgrade Subscription**

   - Method: `POST`
   - URL: `{{baseUrl}}/subscription/upgrade`
   - Auth: Bearer {{accessToken}}
   - Body:

   ```json
   {
     "planId": "{{planId}}",
     "billingCycle": "monthly"
   }
   ```

5. **Cancel Subscription**

   - Method: `POST`
   - URL: `{{baseUrl}}/subscription/cancel`
   - Auth: Bearer {{accessToken}}

6. **Get Subscription Usage**
   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/usage?service=ai_text_writer&period=today`
   - Auth: Bearer {{accessToken}}

---

### **🔹 2. Payment Integration Folder** 💳

```
Folder: "Payment Integration (Stripe)"
Base URL: {{baseUrl}}/payment
```

#### **Endpoints:**

1. **Create Stripe Customer**

   - Method: `POST`
   - URL: `{{baseUrl}}无穷无尽者`/payment/customer/create`
   - Auth: Bearer {{accessToken}}

2. **Create Stripe Subscription**

   - Method: `POST`
   - URL: `{{baseUrl}}/payment/subscription/create`
   - Auth: Bearer {{accessToken}}
   - Body:

   ```json
   {
     "planId": "{{planId}}",
     "billingCycle": "monthly"
   }
   ```

3. **Get Payment Methods**

   - Method: `GET`
   - URL: `{{baseUrl}}/payment/methods`
   - Auth: Bearer {{accessToken}}

4. **Cancel Stripe Subscription**
   - Method: `POST`
   - URL: `{{baseUrl}}/payment/subscription/cancel`
   - Auth: Bearer {{accessToken}}

---

### **🔹 3. Analytics Folder** 📊 (Admin Only)

```
Folder: "Analytics (Admin Only)"
Base URL: {{baseUrl}}/analytics
```

#### **Endpoints:**

1. **Get Dashboard Data**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/dashboard`
   - Auth: Bearer {{accessToken}} (Admin)

2. **Get Subscription Metrics**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/subscriptions`
   - Auth: Bearer {{accessToken}} (Admin)

3. **Get Plan Distribution**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/plans`
   - Auth: Bearer {{accessToken}} (Admin)

4. **Get Revenue Metrics**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/revenue?period=month`
   - Auth: Bearer {{accessToken}} (Admin)
   - Query Params: `period` (day/week/month/year)

5. **Get Usage Analytics**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/usage`
   - Auth: Bearer {{accessToken}} (Admin)

6. **Get User Engagement Metrics**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/engagement`
   - Auth: Bearer {{accessToken}} (Admin)

7. **Get Churn Analysis**

   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/churn`
   - Auth: Bearer {{accessToken}} (Admin)

8. **Get Trial Conversion Funnel**
   - Method: `GET`
   - URL: `{{baseUrl}}/analytics/conversion`
   - Auth: Bearer {{accessToken}} (Admin)

---

### **🔹 4. Real-time Notifications Folder** 🔔

```
Folder: "Real-time Notifications"
Base URL: {{baseUrl}}/subscription
```

#### **Endpoints:**

1. **Check Trial Expiration**

   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/trial/expiration`
   - Auth: Bearer {{accessToken}}

2. **Get Subscription Status**

   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/status`
   - Auth: Bearer {{accessToken}}

3. **Send Upgrade Prompt**
   - Method: `POST`
   - URL: `{{baseUrl}}/subscription/upgrade-prompt`
   - Auth: Bearer {{accessToken}}
   - Body:
   ```json
   {
     "reason": "limit_reached",
     "service": "ai_text_writer"
   }
   ```

---

### **🔹 5. Admin Routes** 👑

Add to existing "Admin Routes" folder:

1. **Get All Subscriptions**
   - Method: `GET`
   - URL: `{{baseUrl}}/subscription/admin/all`
   - Auth: Bearer {{accessToken}} (Admin)

---

## 🔧 **COLLECTION VARIABLES TO ADD:**

Phase 2.5 के लिए ये variables add करें:

```json
{
  "key": "subscriptionId",
  "value": "",
  "type": "string"
},
{
  "key": "planId",
  "value": "",
  "type": "string"
}
```

---

## 📥 **HOW TO IMPORT:**

### **Option 1: Manual Addition (Recommended)**

1. Phase 2 collection 어린이용 खोलें
2. ये folders add करें
3. हर endpoint manually add करें
4. Variables add करें
5. Test scripts लगाएं

### **Option 2: Use Phase 2 JSON**

- Phase 2 collection को base के रूप में use करें
- उपर दिए गए endpoints add करें

---

## 🧪 **TESTING SEQUENCE:**

### **Step 1: Authentication** ✅

- Register/Login करें
- Token automatically save हो जाएगा

### **Step 2: Get Subscription Plans** 💳

- Plans देखें
- planId automatically save हो जाएगा

### **Step 3: Start Trial** 🆓

- Free trial start करें
- Trial limits test करें

### **Step 4: AI Text Generation** 🤖

- Text generate करें
- Usage limits check करें

### **Step 5: Upgrade Subscription** ⬆️

- Paid plan purchase करें (Stripe test mode में)
- Subscription status check करें

### **Step 6: Analytics (Admin)** 📊

- Admin login करें
- Dashboard data देखें
- Metrics और analytics check करें

---

## 🎯 **EXPECTED RESPONSES:**

### **Subscription Plans Response:**

```json
{
  "statusCode": 200,
  "data": {
    "plans": [
      {
        "id": "...",
        "name": "trial",
        "displayName": "Free Trial",
        "description": "7-day free trial",
        "price": {
          "monthly": 0,
          "yearly": 0,
          "currency": "USD"
        },
        "type": "trial",
        "features": { ... },
        "isPopular": true
      }
    ],
    "totalPlans": 5
  },
  "success": true,
  "message": "Subscription plans retrieved successfully"
}
```

### **Trial Start Response:**

```json
{
  "statusCode": 201,
  "data": {
    "trial": {
      "id": "...",
      "startTime": "2025-10-17T11:00:00.000Z",
      "endTime": "2025-10-24T11:00:00.000Z",
      "status": "active",
      "limits": { ... },
      "remainingDays": 7
    },
    "subscription": { ... }
  },
  "success": true,
  "message": "Trial started successfully"
}
```

### **Usage Response:**

```json
{
  "statusCode": 200,
  "data": {
    "usage": {
      "wordsUsedToday": 250,
      "maxWords": 1000,
      "remainingWords": 750,
      "usagePercentage": 25
    }
  },
  "success": true,
  "message": "Usage retrieved successfully"
}
```

---

## ✅ **SUCCESS CRITERIA:**

- ✅ सभी endpoints properly configured
- ✅ Authentication working
- ✅ Variables automatically populate
- ✅ Trial start successful
- ✅ Usage limits enforced
- ✅ Analytics data accessible (Admin)
- ✅ Real-time notifications functional

---

## 🎉 **COMPLETION:**

**Phase 2.5 Postman Collection = Phase 2 Collection + These New Endpoints**

**Ready for testing!** 🚀

---

_Created: October 17, 2025_
_Version: 2.5.0_

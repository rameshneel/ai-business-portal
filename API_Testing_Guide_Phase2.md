# 🚀 **AI BUSINESS PORTAL - PHASE 2 TESTING GUIDE**

## 📋 **OVERVIEW**

This guide provides comprehensive testing instructions for Phase 2 of the AI Business Portal, including:

- **AI Text Writer Service** - Generate AI-powered content
- **Socket.IO Real-time Features** - Live updates and notifications
- **Enhanced Authentication** - JWT-based security
- **Admin Controls** - User management and broadcasting

---

## 🔧 **SETUP INSTRUCTIONS**

### **1. Import Postman Collection**

1. Open Postman
2. Click **Import** button
3. Select `AI_Business_Portal_Postman_Collection_Phase2.json`
4. Collection will be imported with all endpoints

### **2. Environment Variables**

The collection uses these variables (auto-populated on login):

- `{{baseUrl}}` - API base URL (http://localhost:5000/api)
- `{{accessToken}}` - JWT access token
- `{{refreshToken}}` - JWT refresh token
- `{{userId}}` - Current user ID

### **3. Server Setup**

```bash
# Start the server
node src/index.js

# Server will run on:
# HTTP: http://localhost:5000
# Socket.IO: ws://localhost:5000
```

### **4. Testing Mode Configuration**

**Note:** The server is configured in **testing mode** with:

- ✅ **No trial/subscription required** - Users can test AI services immediately
- ✅ **Generous usage limits** - 10,000 words per day for testing
- ✅ **All features enabled** - Full access to AI Text Writer service
- ✅ **Mock AI Service** - Falls back to mock content when OpenAI quota exceeded

**For production deployment, uncomment the trial/subscription checks in the code.**

---

## 🧪 **TESTING SEQUENCE**

### **Phase 1: Authentication Testing**

#### **1.1 User Registration**

```
POST /api/auth/register
```

**Test Data:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Expected:** 201 Created with user data

#### **1.2 User Login**

```
POST /api/auth/login
```

**Test Data:**

```json
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Expected:** 200 OK with tokens (auto-saved to variables)

#### **1.3 Get Current User**

```
GET /api/auth/me
```

**Expected:** 200 OK with user profile

---

### **Phase 2: AI Text Writer Service Testing**

#### **2.1 Get Service Options**

```
GET /api/services/text/options
```

**Expected:** 200 OK with content types, tones, and lengths

#### **2.2 Generate Blog Post**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "Write about the future of artificial intelligence in healthcare",
  "contentType": "blog_post",
  "tone": "professional",
  "length": "medium",
  "language": "English"
}
```

**Expected:** 200 OK with generated text and usage stats

#### **2.3 Generate Social Media Content**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "Promote our new AI-powered business portal",
  "contentType": "social_media",
  "tone": "casual",
  "length": "short",
  "language": "English"
}
```

**Expected:** 200 OK with social media content

#### **2.4 Generate Email**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "Follow up email for potential client meeting",
  "contentType": "email",
  "tone": "professional",
  "length": "medium",
  "language": "English"
}
```

**Expected:** 200 OK with email content

#### **2.5 Generate Product Description**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "AI-powered business automation software",
  "contentType": "product_description",
  "tone": "persuasive",
  "length": "medium",
  "language": "English"
}
```

**Expected:** 200 OK with product description

#### **2.6 Generate Ad Copy**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "Promote our AI business portal with 50% discount",
  "contentType": "ad_copy",
  "tone": "persuasive",
  "length": "short",
  "language": "English"
}
```

**Expected:** 200 OK with ad copy

#### **2.7 Get Generation History**

```
GET /api/services/text/history?page=1&limit=10
```

**Expected:** 200 OK with paginated history

#### **2.8 Get Usage Statistics**

```
GET /api/services/text/usage
```

**Expected:** 200 OK with usage stats

---

### **Phase 3: Socket.IO Real-time Features Testing**

#### **3.1 Get Socket.IO Status**

```
GET /api/socket/status
```

**Expected:** 200 OK with service status and features

#### **3.2 Get Connected Users**

```
GET /api/socket/connected-users
```

**Expected:** 200 OK with connected users list

#### **3.3 Check User Online Status**

```
GET /api/socket/user/{{userId}}/status
```

**Expected:** 200 OK with online status

#### **3.4 Send Notification**

```
POST /api/socket/notify/{{userId}}
```

**Test Data:**

```json
{
  "title": "AI Text Generation Complete",
  "message": "Your blog post has been generated successfully!",
  "type": "success",
  "data": {
    "service": "ai_text_writer",
    "wordsGenerated": 250
  }
}
```

**Expected:** 200 OK with notification sent status

#### **3.5 Admin Broadcast (Admin Only)**

```
POST /api/socket/admin/broadcast
```

**Test Data:**

```json
{
  "message": "System maintenance scheduled for tonight at 2 AM",
  "type": "warning",
  "data": {
    "maintenanceWindow": "2:00 AM - 4:00 AM",
    "affectedServices": ["AI Text Writer", "AI Image Generator"]
  }
}
```

**Expected:** 200 OK with broadcast sent

#### **3.6 Admin Role Broadcast (Admin Only)**

```
POST /api/socket/admin/broadcast/customer
```

**Test Data:**

```json
{
  "message": "New AI Image Generator service is now available!",
  "type": "info",
  "data": {
    "newService": "AI Image Generator",
    "features": ["Multiple art styles", "High resolution", "Batch generation"]
  }
}
```

**Expected:** 200 OK with role-specific broadcast

---

### **Phase 4: Error Testing**

#### **4.1 Invalid Login**

```
POST /api/auth/login
```

**Test Data:**

```json
{
  "email": "invalid@example.com",
  "password": "wrongpassword"
}
```

**Expected:** 401 Unauthorized

#### **4.2 Unauthorized Access**

```
GET /api/auth/me
```

**Without Authorization header**
**Expected:** 401 Unauthorized

#### **4.3 Invalid Token**

```
GET /api/auth/me
```

**With invalid token**
**Expected:** 401 Unauthorized

#### **4.4 Validation Error**

```
POST /api/services/text/generate
```

**Test Data:**

```json
{
  "prompt": "Hi",
  "contentType": "invalid_type"
}
```

**Expected:** 400 Bad Request with validation errors

---

## 🔍 **EXPECTED RESPONSES**

### **Success Response Format**

```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message"
}
```

### **Error Response Format**

```json
{
  "success": false,
  "message": "Error message",
  "stack": "Error stack trace (development only)"
}
```

### **AI Text Generation Response**

```json
{
  "success": true,
  "data": {
    "generatedText": "Generated content...",
    "wordsGenerated": 250,
    "contentType": "blog_post",
    "duration": 1500,
    "usage": {
      "wordsUsedToday": 250,
      "maxWords": 1000,
      "remainingWords": 750
    }
  },
  "message": "Text generated successfully"
}
```

### **Socket.IO Status Response**

```json
{
  "success": true,
  "data": {
    "service": "Socket.IO",
    "status": "active",
    "connectedUsers": 5,
    "features": [
      "Real-time AI service updates",
      "Live notifications",
      "Admin broadcasts",
      "User presence tracking",
      "Chat functionality",
      "Role-based messaging"
    ],
    "endpoints": {
      "websocket": "ws://localhost:5000",
      "events": [
        "ai_text_generation_start",
        "ai_text_generation_progress",
        "ai_service_complete",
        "notification",
        "admin_message",
        "user_online",
        "user_offline",
        "connected"
      ]
    }
  },
  "message": "Socket.IO service status retrieved successfully"
}
```

---

## 🎯 **TESTING CHECKLIST**

### **✅ Authentication**

- [ ] User registration works
- [ ] User login works
- [ ] Tokens are auto-saved
- [ ] JWT authentication works
- [ ] Token refresh works
- [ ] Logout works

### **✅ AI Text Writer Service**

- [ ] Service options retrieved
- [ ] Blog post generation works
- [ ] Social media generation works
- [ ] Email generation works
- [ ] Product description generation works
- [ ] Ad copy generation works
- [ ] History retrieval works
- [ ] Usage statistics work
- [ ] Usage limits enforced
- [ ] Performance tracking works

### **✅ Socket.IO Features**

- [ ] Service status retrieved
- [ ] Connected users list works
- [ ] User online status works
- [ ] Notifications sent successfully
- [ ] Admin broadcasts work
- [ ] Role-based broadcasts work
- [ ] Real-time events work

### **✅ Error Handling**

- [ ] Invalid login handled
- [ ] Unauthorized access blocked
- [ ] Invalid tokens rejected
- [ ] Validation errors returned
- [ ] Proper error messages shown

---

## 🚀 **REAL-TIME TESTING**

### **Socket.IO Client Testing**

To test real-time features, you can use a simple HTML page:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Socket.IO Test</title>
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
  </head>
  <body>
    <div id="messages"></div>
    <script>
      const socket = io("http://localhost:5000", {
        auth: {
          token: "YOUR_JWT_TOKEN_HERE",
        },
      });

      socket.on("connected", (data) => {
        console.log("Connected:", data);
      });

      socket.on("ai_text_generation_start", (data) => {
        console.log("AI Generation Started:", data);
      });

      socket.on("ai_service_complete", (data) => {
        console.log("AI Service Complete:", data);
      });

      socket.on("notification", (data) => {
        console.log("Notification:", data);
      });

      socket.on("admin_message", (data) => {
        console.log("Admin Message:", data);
      });
    </script>
  </body>
</html>
```

---

## 📊 **PERFORMANCE EXPECTATIONS**

### **Response Times**

- **Authentication:** < 200ms
- **AI Text Generation:** < 5 seconds
- **Socket.IO Events:** < 100ms
- **Database Queries:** < 500ms

### **Usage Limits**

- **Testing Mode:** 10000 words/day (generous limits for testing)
- **Production Trial Users:** 1000 words/day, 10 requests/day
- **Production Paid Users:** 10000 words/day, 100 requests/day

---

## 🎉 **SUCCESS CRITERIA**

### **✅ Phase 2 Complete When:**

- [ ] All API endpoints respond correctly
- [ ] AI Text Writer generates quality content
- [ ] Socket.IO real-time features work
- [ ] Authentication is secure
- [ ] Error handling is robust
- [ ] Performance meets expectations
- [ ] Usage tracking works accurately

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues:**

1. **401 Unauthorized**

   - Check if token is valid
   - Ensure Authorization header is set
   - Verify token hasn't expired

2. **403 Forbidden**

   - Check user permissions
   - Verify trial/subscription status
   - Check usage limits

3. **500 Internal Server Error**

   - Check server logs
   - Verify OpenAI API key
   - Check database connection

4. **Socket.IO Connection Failed**
   - Check server is running
   - Verify CORS settings
   - Check authentication token

---

## 📞 **SUPPORT**

For issues or questions:

1. Check server logs
2. Verify environment variables
3. Test individual endpoints
4. Check database connectivity
5. Verify OpenAI API key

**Phase 2 Testing Complete!** 🎉

# 🚀 Socket.IO Postman Testing - Quick Start Guide

## 📥 Import Collection

1. **Postman में Collection Import करें:**
   - Postman खोलें
   - `Import` button पर click करें
   - `AI_Business_Portal_SocketIO_Collection.json` file select करें
   - Import करें

## 🔧 Server Setup

2. **Server Start करें:**

   ```bash
   cd "d:\ai project\ai-business-portal"
   npm run dev
   ```

3. **Environment Setup करें:**
   ```bash
   setup-env.bat
   ```

## 🎯 Step-by-Step Testing

### Step 1: Authentication

1. **"🔐 Authentication"** folder में जाएं
2. **"1. Register User"** run करें (optional - user already exist हो सकता है)
3. **"2. Login User"** run करें
   - ✅ JWT token automatically save हो जाएगा
   - ✅ User ID automatically save हो जाएगा

### Step 2: Health Check

1. **"🏥 Health Check"** folder में जाएं
2. **"Server Health Check"** run करें
3. **"Socket.IO Status"** run करें

### Step 3: Socket.IO Connection

1. **Postman में New Socket.IO Request बनाएं:**

   - `New` → `Socket.IO Request`
   - URL: `http://localhost:5000`
   - Headers में: `Authorization: Bearer {{jwt_token}}`
   - `Connect` button दबाएं

2. **Connection Success होने पर:**
   - Status: `Connected` दिखेगा
   - `connected` event receive होगा

### Step 4: Test Real-time Features

1. **"📱 Socket.IO Events Testing"** folder में जाएं
2. **"Send Notification to User"** run करें
3. **Socket.IO connection में notification receive करें**

### Step 5: Admin Testing (Optional)

1. **"👑 Admin Testing"** folder में जाएं
2. **"Create Admin User"** run करें
3. **"Login Admin User"** run करें
4. **"Admin Broadcast Message"** run करें
5. **Socket.IO connection में admin message receive करें**

## 🎮 Socket.IO Events Testing

### Basic Events to Test:

#### 1. Connection Test

```json
Event: connected
Response: User details and connection confirmation
```

#### 2. Send Test Message

```json
Event: test_message
Data: {"text": "Hello from Postman!"}
```

#### 3. Join Chat Room

```json
Event: join_chat
Data: "chat_room_123"
```

#### 4. Send Chat Message

```json
Event: send_message
Data: {
  "chatId": "chat_room_123",
  "message": "Hello everyone!",
  "type": "text"
}
```

#### 5. AI Service Test

```json
Event: ai_text_generation_start
Data: {
  "contentType": "blog_post",
  "topic": "Artificial Intelligence"
}
```

## 🔍 Expected Results

### Successful Connection:

```json
{
  "message": "Successfully connected to server",
  "userId": "user_id_here",
  "user": {
    "_id": "user_id_here",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "role": "customer"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Notification Received:

```json
{
  "id": "notification_id",
  "title": "Test Notification",
  "message": "This is a test notification from Postman",
  "type": "info",
  "data": {
    "source": "postman_test",
    "timestamp": "timestamp_here"
  },
  "sender": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🚨 Troubleshooting

### Connection Failed:

- ✅ Server running है? `npm run dev`
- ✅ MongoDB running है?
- ✅ Port 5000 free है?
- ✅ JWT token valid है?

### Authentication Failed:

- ✅ User registered है?
- ✅ Password correct है?
- ✅ JWT token expired नहीं है?

### No Events Received:

- ✅ Socket.IO connection established है?
- ✅ Event name correct है?
- ✅ Data format correct है?

## 📋 Quick Checklist

- [ ] Collection imported
- [ ] Server started (`npm run dev`)
- [ ] Environment setup (`setup-env.bat`)
- [ ] User logged in (JWT token saved)
- [ ] Socket.IO connected
- [ ] Test events working
- [ ] Notifications received
- [ ] Admin features tested (optional)

## 🎯 Success Indicators

✅ **Server Running:** Health check returns 200
✅ **Authentication:** Login successful, JWT token saved
✅ **Socket.IO Connected:** Status shows "Connected"
✅ **Real-time Events:** Notifications received instantly
✅ **Admin Features:** Broadcast messages working

## 📞 Support

अगर कोई problem आए:

1. Server logs check करें
2. MongoDB connection verify करें
3. JWT token validity check करें
4. Network connectivity test करें

**Happy Testing! 🚀**


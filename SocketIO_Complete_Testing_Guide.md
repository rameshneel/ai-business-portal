# 🔌 Socket.IO Postman Testing - Complete Setup

## 📋 Step-by-Step Socket.IO Testing

### 1. 🔐 Authentication (HTTP Requests)

#### Step 1: Register User

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123",
  "role": "customer"
}
```

#### Step 2: Login User

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Response में `accessToken` को copy करें - यह Socket.IO authentication के लिए चाहिए**

### 2. 🔌 Socket.IO Connection Setup

#### Postman में Socket.IO Request बनाएं:

1. **New Socket.IO Request:**

   - Postman में `New` → `Socket.IO Request`
   - URL: `http://localhost:5000`

2. **Authentication Setup:**

   - **Headers** tab में add करें:
     ```
     Authorization: Bearer YOUR_JWT_TOKEN_HERE
     ```
   - या **Auth** tab में:
     ```
     Token: YOUR_JWT_TOKEN_HERE
     ```

3. **Connection Settings:**

   - Transport: WebSocket (preferred)
   - Auto Connect: Enable
   - Reconnection: Enable

4. **Connect करें:**
   - `Connect` button दबाएं
   - Status `Connected` दिखना चाहिए

### 3. 📱 Socket.IO Events Testing

#### Event 1: Connection Test

```json
Event Name: connected
Expected Response:
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

#### Event 2: Send Test Message

```json
Event Name: test_message
Data: {"text": "Hello from Postman!"}
```

#### Event 3: Join Chat Room

```json
Event Name: join_chat
Data: "chat_room_123"
```

#### Event 4: Send Chat Message

```json
Event Name: send_message
Data: {
  "chatId": "chat_room_123",
  "message": "Hello everyone!",
  "type": "text"
}
```

#### Event 5: AI Service Test

```json
Event Name: ai_text_generation_start
Data: {
  "contentType": "blog_post",
  "topic": "Artificial Intelligence"
}
```

### 4. 🔔 Notification Testing

#### HTTP Request से Notification Send करें:

```http
POST http://localhost:5000/api/socket/notify/USER_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "This is a test notification from Postman",
  "type": "info",
  "data": {
    "source": "postman_test",
    "timestamp": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Socket.IO में Notification Receive करें:

```json
Event Name: notification
Expected Response:
{
  "id": "notification_id",
  "title": "Test Notification",
  "message": "This is a test notification from Postman",
  "type": "info",
  "data": {
    "source": "postman_test",
    "timestamp": "2024-01-01T00:00:00.000Z"
  },
  "sender": {
    "_id": "user_id",
    "firstName": "John",
    "lastName": "Doe"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 5. 👑 Admin Testing

#### Admin User बनाएं:

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "password": "Admin123",
  "role": "admin"
}
```

#### Admin Login करें:

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "Admin123"
}
```

#### Admin Broadcast Send करें:

```http
POST http://localhost:5000/api/socket/admin/broadcast
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "message": "Server maintenance scheduled for tonight at 2 AM",
  "type": "warning",
  "data": {
    "maintenance": true,
    "duration": "2 hours"
  }
}
```

#### Socket.IO में Admin Message Receive करें:

```json
Event Name: admin_message
Expected Response:
{
  "message": "Server maintenance scheduled for tonight at 2 AM",
  "type": "warning",
  "data": {
    "maintenance": true,
    "duration": "2 hours"
  },
  "admin": {
    "_id": "admin_user_id",
    "firstName": "Admin",
    "lastName": "User"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🎯 Complete Testing Workflow

### Phase 1: Setup

1. ✅ Server start करें: `npm run dev`
2. ✅ User register/login करें
3. ✅ JWT token copy करें
4. ✅ Socket.IO connection establish करें

### Phase 2: Basic Testing

1. ✅ Connection confirmation check करें
2. ✅ Test message send करें
3. ✅ Chat room join करें
4. ✅ Chat message send करें

### Phase 3: Advanced Testing

1. ✅ Notification send/receive करें
2. ✅ Admin user create करें
3. ✅ Admin broadcast test करें
4. ✅ AI service events test करें

### Phase 4: Multi-User Testing

1. ✅ Multiple users create करें
2. ✅ Multiple Socket.IO connections open करें
3. ✅ Cross-user communication test करें
4. ✅ Real-time notifications test करें

## 🚨 Troubleshooting

### Connection Issues:

- ✅ Server running: `npm run dev`
- ✅ MongoDB running
- ✅ Port 5000 free
- ✅ JWT token valid

### Authentication Issues:

- ✅ User exists in database
- ✅ Password correct
- ✅ JWT token not expired
- ✅ Token format: `Bearer TOKEN`

### Event Issues:

- ✅ Event name correct
- ✅ Data format correct
- ✅ User permissions adequate
- ✅ Server logs check करें

## 📊 Expected Results

### Successful Connection:

```
Status: Connected
Response: connected event with user details
```

### Notification Flow:

```
HTTP Request → Server → Socket.IO → Client
```

### Admin Broadcast:

```
Admin HTTP Request → Server → All Connected Users
```

## 🎮 Quick Test Commands

### Server Health:

```bash
curl http://localhost:5000/health
```

### User Login:

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Password123"}'
```

### Socket.IO Status:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/socket/status
```

## 📱 Socket.IO Events Summary

| Event                      | Direction       | Description             |
| -------------------------- | --------------- | ----------------------- |
| `connected`                | Server → Client | Connection confirmation |
| `notification`             | Server → Client | Receive notifications   |
| `admin_message`            | Server → Client | Admin broadcasts        |
| `user_online`              | Server → Client | User comes online       |
| `user_offline`             | Server → Client | User goes offline       |
| `send_message`             | Client → Server | Send chat message       |
| `join_chat`                | Client → Server | Join chat room          |
| `ai_text_generation_start` | Client → Server | Start AI service        |

## ✅ Success Checklist

- [ ] Server running on port 5000
- [ ] User authenticated with JWT token
- [ ] Socket.IO connection established
- [ ] Basic events working
- [ ] Notifications received
- [ ] Admin features functional
- [ ] Multi-user testing completed

**अब आप complete Socket.IO testing कर सकते हैं! 🚀**

# Socket.IO Postman Testing Guide

## AI Business Portal - Real-time Features

### 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Setup](#server-setup)
3. [Authentication Setup](#authentication-setup)
4. [Postman Socket.IO Configuration](#postman-socketio-configuration)
5. [Testing Socket.IO Events](#testing-socketio-events)
6. [Available Events](#available-events)
7. [Troubleshooting](#troubleshooting)
8. [Advanced Testing Scenarios](#advanced-testing-scenarios)

---

## Prerequisites

### Required Software

- **Postman** (Latest version with Socket.IO support)
- **Node.js** (v18 or higher)
- **MongoDB** (Running locally or cloud instance)

### Environment Variables

Make sure your `.env` file contains:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-business-portal
ACCESS_TOKEN_SECRET=your-secret-key
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

---

## Server Setup

### 1. Start the Server

```bash
# Navigate to project directory
cd "d:\ai project\ai-business-portal"

# Install dependencies (if not already done)
npm install

# Start the server
npm run dev
```

### 2. Verify Server is Running

- **Health Check**: `GET http://localhost:5000/health`
- **Socket.IO Status**: `GET http://localhost:5000/api/socket/status` (requires authentication)

---

## Authentication Setup

### 1. Register a User

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Test",
  "lastName": "User",
  "email": "test@example.com",
  "password": "password123",
  "role": "customer"
}
```

### 2. Login to Get JWT Token

```http
POST http://localhost:5000/api/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

**Save the `accessToken` from the response - you'll need it for Socket.IO authentication.**

---

## Postman Socket.IO Configuration

### 1. Create New Socket.IO Request

1. Open Postman
2. Click **"New"** → **"Socket.IO Request"**
3. Set URL: `http://localhost:5000`

### 2. Authentication Setup

In the **Headers** tab, add:

```
Authorization: Bearer YOUR_JWT_TOKEN_HERE
```

**OR** in the **Auth** tab, add:

```
Token: YOUR_JWT_TOKEN_HERE
```

### 3. Connection Settings

- **Transport**: WebSocket (preferred) or Polling
- **Auto Connect**: Enable for automatic connection
- **Reconnection**: Enable for automatic reconnection

---

## Testing Socket.IO Events

### 1. Basic Connection Test

#### Connect to Server

1. Click **"Connect"** button
2. You should see:
   - Connection status: **"Connected"**
   - Response: `connected` event with user details

#### Expected Response:

```json
{
  "message": "Successfully connected to server",
  "userId": "user_id_here",
  "user": {
    "_id": "user_id_here",
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "role": "customer"
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Send Test Message

#### Send a Simple Message

1. In the **Message** tab:
   - **Event Name**: `test_message`
   - **Message**: `{"text": "Hello from Postman!"}`
2. Click **"Send"**

#### Expected Response:

```json
{
  "text": "Hello from Postman!",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Available Events

### 🔌 Connection Events

| Event          | Description                | Data Format                          |
| -------------- | -------------------------- | ------------------------------------ |
| `connected`    | Server confirms connection | `{message, userId, user, timestamp}` |
| `user_online`  | Another user comes online  | `{userId, user, timestamp}`          |
| `user_offline` | Another user goes offline  | `{userId, timestamp}`                |

### 🤖 AI Service Events

| Event                         | Description                | Data Format                        |
| ----------------------------- | -------------------------- | ---------------------------------- |
| `ai_text_generation_start`    | AI text generation begins  | `{contentType, timestamp}`         |
| `ai_text_generation_progress` | AI generation progress     | `{status, contentType, timestamp}` |
| `ai_image_generation_start`   | AI image generation begins | `{prompt, timestamp}`              |
| `ai_service_complete`         | AI service finished        | `{service, result, timestamp}`     |

### 💬 Chat Events

| Event          | Description             | Data Format                    |
| -------------- | ----------------------- | ------------------------------ |
| `join_chat`    | Join a chat room        | `{chatId}`                     |
| `leave_chat`   | Leave a chat room       | `{chatId}`                     |
| `send_message` | Send chat message       | `{chatId, message, type}`      |
| `new_message`  | Receive new message     | `{chatId, message}`            |
| `chat_joined`  | Confirmation of joining | `{chatId, message, timestamp}` |

### 🔔 Notification Events

| Event                    | Description               | Data Format                                |
| ------------------------ | ------------------------- | ------------------------------------------ |
| `notification`           | Receive notification      | `{id, title, message, type, data, sender}` |
| `send_notification`      | Send notification to user | `{userId, notification}`                   |
| `mark_notification_read` | Mark notification as read | `{notificationId}`                         |
| `notification_read`      | Confirmation of read      | `{notificationId, timestamp}`              |

### 👑 Admin Events

| Event                | Description             | Data Format                         |
| -------------------- | ----------------------- | ----------------------------------- |
| `admin_broadcast`    | Admin broadcasts to all | `{message, type, admin}`            |
| `admin_role_message` | Admin message to role   | `{role, message, type, admin}`      |
| `admin_message`      | Receive admin message   | `{message, type, admin, timestamp}` |

---

## Testing Socket.IO Events

### 1. Test AI Service Events

#### Start AI Text Generation

```json
{
  "event": "ai_text_generation_start",
  "data": {
    "contentType": "blog_post",
    "topic": "Artificial Intelligence"
  }
}
```

#### Expected Response:

```json
{
  "status": "started",
  "contentType": "blog_post",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Chat Functionality

#### Join a Chat Room

```json
{
  "event": "join_chat",
  "data": "chat_room_123"
}
```

#### Send a Message

```json
{
  "event": "send_message",
  "data": {
    "chatId": "chat_room_123",
    "message": "Hello everyone!",
    "type": "text"
  }
}
```

### 3. Test Notifications

#### Send Notification to User

```json
{
  "event": "send_notification",
  "data": {
    "userId": "target_user_id",
    "notification": {
      "title": "New Message",
      "message": "You have a new message",
      "type": "info",
      "data": { "chatId": "chat_123" }
    }
  }
}
```

---

## Troubleshooting

### Common Issues and Solutions

#### 1. Connection Failed

**Error**: `Could not connect to http://localhost:5000`

**Solutions**:

- ✅ Check if server is running: `npm run dev`
- ✅ Verify port 5000 is not blocked
- ✅ Check firewall settings
- ✅ Ensure MongoDB is running

#### 2. Authentication Failed

**Error**: `Authentication token required` or `Invalid authentication token`

**Solutions**:

- ✅ Verify JWT token is valid and not expired
- ✅ Check token format: `Bearer YOUR_TOKEN` or just `YOUR_TOKEN`
- ✅ Ensure user exists in database
- ✅ Verify `ACCESS_TOKEN_SECRET` in environment

#### 3. CORS Issues

**Error**: CORS policy errors

**Solutions**:

- ✅ Check `FRONTEND_URL` in `.env` file
- ✅ Verify CORS configuration in `app.js`
- ✅ Use `http://localhost:5000` instead of `ws://localhost:5000`

#### 4. Event Not Received

**Issue**: Sent event but no response

**Solutions**:

- ✅ Check event name spelling
- ✅ Verify data format matches expected schema
- ✅ Check server logs for errors
- ✅ Ensure user has proper permissions

### Debug Steps

#### 1. Check Server Logs

```bash
# Monitor server logs
npm run dev

# Look for Socket.IO connection messages:
# 🔌 User connected: user@example.com (socket_id)
# 🔌 User disconnected: user@example.com (socket_id) - reason
```

#### 2. Test with Multiple Clients

1. Open multiple Postman instances
2. Connect with different users
3. Test real-time communication between clients

#### 3. Verify Database Connection

```bash
# Check MongoDB connection
mongosh
use ai-business-portal
db.users.find()
```

---

## Advanced Testing Scenarios

### 1. Multi-User Testing

#### Setup Multiple Users

1. Register 2-3 different users
2. Login with each user to get tokens
3. Open multiple Postman instances
4. Connect each with different tokens

#### Test Real-time Communication

- Send messages between users
- Test notifications
- Verify user presence (online/offline)

### 2. Admin Testing

#### Create Admin User

```http
POST http://localhost:5000/api/auth/register
Content-Type: application/json

{
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com",
  "password": "admin123",
  "role": "admin"
}
```

#### Test Admin Broadcasts

```json
{
  "event": "admin_broadcast",
  "data": {
    "message": "Server maintenance scheduled",
    "type": "warning"
  }
}
```

### 3. Error Handling Testing

#### Test Invalid Events

```json
{
  "event": "invalid_event",
  "data": { "test": "data" }
}
```

#### Test Malformed Data

```json
{
  "event": "send_message",
  "data": "invalid_format"
}
```

### 4. Performance Testing

#### Load Testing

1. Connect multiple clients (10-20)
2. Send rapid messages
3. Monitor server performance
4. Check for memory leaks

---

## API Endpoints for Socket.IO Management

### Get Connected Users

```http
GET http://localhost:5000/api/socket/connected-users
Authorization: Bearer YOUR_JWT_TOKEN
```

### Check User Status

```http
GET http://localhost:5000/api/socket/user/USER_ID/status
Authorization: Bearer YOUR_JWT_TOKEN
```

### Send Notification via REST

```http
POST http://localhost:5000/api/socket/notify/USER_ID
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "title": "Test Notification",
  "message": "This is a test notification",
  "type": "info",
  "data": {"test": true}
}
```

### Admin Broadcast via REST

```http
POST http://localhost:5000/api/socket/admin/broadcast
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "message": "Server maintenance in 10 minutes",
  "type": "warning",
  "data": {"maintenance": true}
}
```

---

## Best Practices

### 1. Testing Strategy

- ✅ Test connection/disconnection scenarios
- ✅ Test all event types systematically
- ✅ Test error conditions and edge cases
- ✅ Test with multiple concurrent users

### 2. Data Validation

- ✅ Always validate event data format
- ✅ Test with invalid/missing data
- ✅ Verify authentication for protected events

### 3. Performance Monitoring

- ✅ Monitor connection count
- ✅ Check memory usage
- ✅ Test reconnection scenarios

### 4. Security Testing

- ✅ Test with invalid tokens
- ✅ Test with expired tokens
- ✅ Verify role-based access control

---

## Quick Reference

### Connection URL

```
http://localhost:5000
```

### Required Headers

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Common Event Names

- `connected` - Connection confirmation
- `send_message` - Send chat message
- `notification` - Receive notification
- `admin_broadcast` - Admin broadcast (admin only)
- `ai_text_generation_start` - Start AI text generation

### Server Status Check

```http
GET http://localhost:5000/health
```

---

## Support

If you encounter issues:

1. Check server logs for error messages
2. Verify all environment variables are set
3. Ensure MongoDB is running and accessible
4. Check network connectivity and firewall settings
5. Verify JWT token validity and format

For additional help, refer to:

- Socket.IO Documentation: https://socket.io/docs/
- Postman Socket.IO Guide: https://learning.postman.com/docs/sending-requests/websocket/
- Your project's API documentation in `API_Testing_Guide_Phase2.md`

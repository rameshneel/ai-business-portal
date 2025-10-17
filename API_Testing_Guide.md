# 🚀 **AI Business Portal API Testing Guide**

## 📋 **How to Use Postman Collection:**

### **1. Import Collection:**

1. Open Postman
2. Click "Import" button
3. Select `AI_Business_Portal_Postman_Collection.json`
4. Collection will be imported with all requests

### **2. Set Environment Variables:**

- `baseUrl`: `http://localhost:5000/api`
- `accessToken`: (Auto-filled after login)
- `refreshToken`: (Auto-filled after login)
- `userId`: (Auto-filled after login)

---

## 🧪 **Testing Sequence:**

### **Step 1: Health Check**

```
GET /api/health
GET /health
```

### **Step 2: Register User**

```
POST /api/auth/register
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

### **Step 3: Login User**

```
POST /api/auth/login
{
  "email": "john.doe@example.com",
  "password": "Password123"
}
```

**Note:** Tokens will be auto-saved to variables

### **Step 4: Test Protected Routes**

```
GET /api/auth/me
PUT /api/auth/me
PUT /api/auth/me/password
```

### **Step 5: Test Admin Routes** (if user is admin)

```
GET /api/auth/users
GET /api/auth/users/:userId
PATCH /api/auth/users/:userId
DELETE /api/auth/users/:userId
```

---

## 📊 **Expected Response Formats:**

### **Success Response:**

```json
{
  "statusCode": 200,
  "data": {
    /* response data */
  },
  "message": "Success message",
  "success": true
}
```

### **Error Response:**

```json
{
  "statusCode": 400,
  "message": "Error message",
  "success": false,
  "errors": [
    /* validation errors */
  ]
}
```

---

## 🔧 **Test Data Examples:**

### **Valid User Registration:**

```json
{
  "firstName": "Alice",
  "lastName": "Johnson",
  "email": "alice.johnson@example.com",
  "password": "SecurePass123"
}
```

### **Profile Update:**

```json
{
  "firstName": "Alice",
  "lastName": "Smith",
  "email": "alice.smith@example.com"
}
```

### **Password Change:**

```json
{
  "oldPassword": "SecurePass123",
  "newPassword": "NewSecurePass456"
}
```

### **Admin User Status Update:**

```json
{
  "isActive": true,
  "role": "admin"
}
```

---

## 🚨 **Error Testing:**

### **Invalid Registration:**

```json
{
  "firstName": "A",
  "lastName": "B",
  "email": "invalid-email",
  "password": "123"
}
```

### **Wrong Login:**

```json
{
  "email": "wrong@example.com",
  "password": "wrongpassword"
}
```

---

## 📈 **Testing Checklist:**

- ✅ **Health Check** - Server running
- ✅ **User Registration** - Create new user
- ✅ **User Login** - Get tokens
- ✅ **Token Refresh** - Refresh expired tokens
- ✅ **Get Profile** - Fetch user data
- ✅ **Update Profile** - Modify user info
- ✅ **Change Password** - Update password
- ✅ **Admin Routes** - User management
- ✅ **Error Handling** - Invalid requests
- ✅ **Logout** - Clear tokens

---

## 🎯 **Quick Start:**

1. **Start your server:** `npm run dev`
2. **Import Postman collection**
3. **Run Health Check** to verify server
4. **Register a new user**
5. **Login with credentials**
6. **Test all protected routes**

**Happy Testing!** 🚀

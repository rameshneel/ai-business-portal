# 🤖 Phase 3.2: AI Chatbot Builder - Complete Workflow

## 📋 **OVERVIEW**

Complete user journey from registration to creating, training, and using AI chatbots with RAG (Retrieval Augmented Generation).

---

## 🔄 **COMPLETE WORKFLOW**

### **1️⃣ USER REGISTRATION & SUBSCRIPTION**

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
    "subscription": "free" // Auto-assigned Free Plan
  }
}
```

**What Happens:**
- ✅ User created in database
- ✅ Default **Free Plan** subscription auto-assigned
- ✅ Free Plan limits applied:
  - 1 chatbot allowed
  - 3 PDFs / 10MB total per chatbot
  - 20 messages/day (~10 queries/hour)
  - Basic features only

---

### **2️⃣ VIEW AVAILABLE CHATBOT TEMPLATES**

```
GET /api/chatbot/templates
Authorization: Bearer <token>

Response:
{
  "templates": [
    {
      "id": "customerSupport",
      "name": "Customer Support",
      "description": "AI assistant for customer service...",
      "systemPrompt": "...",
      "config": {...}
    },
    {
      "id": "generalAssistant",
      "name": "General Assistant",
      ...
    },
    {
      "id": "faqAssistant",
      "name": "FAQ Assistant",
      ...
    }
  ]
}
```

**Available Templates:**
- ✅ Customer Support
- ✅ General Assistant
- ✅ FAQ Assistant

---

### **3️⃣ CREATE A CHATBOT**

```
POST /api/chatbot
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Support Bot",
  "description": "Customer support chatbot for my website",
  "template": "customerSupport" // Optional: Use pre-built template
}

Response:
{
  "chatbot": {
    "id": "...",
    "name": "My Support Bot",
    "status": "inactive",
    "widget": {
      "apiKey": "cb_...",
      "url": "http://localhost:5000/widget.html?id=...&key=...",
      "code": "<iframe src='...'></iframe>"
    },
    "config": {
      "systemPrompt": "...",
      "temperature": 0.7,
      "maxTokens": 500
    }
  }
}
```

**What Happens:**
- ✅ **Plan Check**: Verifies user has active subscription
- ✅ **Limit Check**: 
  - Free Plan: Max 1 chatbot
  - Basic Plan: Max 5 chatbots
  - Pro Plan: Max 10 chatbots
  - Enterprise: Unlimited
- ✅ **Collection Created**: ChromaDB collection created for vector storage
- ✅ **API Key Generated**: Unique API key for widget authentication
- ✅ **Template Applied**: If template selected, pre-configured settings applied
- ✅ **Pre-training**: If template has pre-training data, chatbot auto-trained in background

**Free Plan Behavior:**
- ✅ Only 1 chatbot allowed
- ✅ Template selection recommended (has pre-training data)

---

### **4️⃣ TRAIN CHATBOT WITH PDF/TEXT FILES**

```
POST /api/chatbot/:id/train/file
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <PDF or TXT file>

Response:
{
  "message": "Chatbot trained successfully",
  "chunks": 150,
  "pages": 10,
  "status": "completed"
}
```

**What Happens:**
1. ✅ **File Upload**: PDF/TXT file uploaded (max 10MB per file)
2. ✅ **Plan Limits Check**:
   - Free Plan: Max 3 PDFs per chatbot, 10MB total
   - Paid Plans: Unlimited PDFs
3. ✅ **Text Extraction**: 
   - PDF: Extracted using `pdf-parse`
   - TXT: Read directly
4. ✅ **Text Chunking**: 
   - Text split into chunks (default: 1000 chars)
   - Overlap: 200 chars between chunks
5. ✅ **Embeddings Generation**: 
   - OpenAI embeddings API (text-embedding-3-small)
   - Converts chunks to vectors
6. ✅ **Vector Storage**: 
   - Stored in ChromaDB collection
   - Metadata includes chunk index, chatbot ID, upload date
7. ✅ **Statistics Update**:
   - `totalDocuments` incremented
   - `totalChunks` updated
   - `totalSize` updated (bytes)
   - `trainingStatus` set to "completed"

**Free Plan Limits:**
- ✅ Max 3 PDF files per chatbot
- ✅ Max 10MB total size per chatbot
- ✅ Error if limit exceeded

---

### **5️⃣ TRAIN CHATBOT WITH RAW TEXT**

```
POST /api/chatbot/:id/train/text
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "Your custom training text here..."
}

Response:
{
  "message": "Chatbot trained successfully",
  "chunks": 25,
  "status": "completed"
}
```

**What Happens:**
- ✅ Same process as file training
- ✅ Text chunked and embedded
- ✅ Stored in ChromaDB
- ✅ Statistics updated

---

### **6️⃣ QUERY CHATBOT (Chat with AI)**

```
POST /api/chatbot/:id/query
Authorization: Bearer <token>
Content-Type: application/json

{
  "query": "What is your return policy?",
  "sessionId": "session-123" // Optional: for conversation history
}

Response:
{
  "response": "Our return policy allows returns within 30 days...",
  "sessionId": "session-123",
  "sources": ["chunk-1", "chunk-2"],
  "metadata": {
    "tokens": 150,
    "responseTime": 1200
  }
}
```

**What Happens:**
1. ✅ **Rate Limit Check**:
   - Free Plan: 10 queries/hour
   - Basic Plan: ~41 queries/hour
   - Pro Plan: ~125 queries/hour
   - Enterprise: Unlimited
2. ✅ **Query Embedding**: 
   - User query converted to embedding vector
3. ✅ **Vector Search**: 
   - ChromaDB searched for similar chunks
   - Top K chunks retrieved (default: 5)
4. ✅ **Context Building**: 
   - Retrieved chunks combined with system prompt
   - Context-aware prompt created
5. ✅ **AI Response**: 
   - OpenAI GPT-3.5-turbo generates response
   - Uses retrieved context for accuracy
6. ✅ **Conversation Saved**: 
   - Message saved to Conversation model
   - Session ID tracked
   - Statistics updated

**RAG Flow:**
```
User Query → Embedding → Vector Search → Top K Chunks → 
Context + System Prompt → GPT-3.5 → Response → Save Conversation
```

---

### **7️⃣ GET CHATBOT WIDGET CODE**

```
GET /api/chatbot/:id/widget
Authorization: Bearer <token>

Response:
{
  "widget": {
    "apiKey": "cb_...",
    "url": "http://localhost:5000/widget.html?id=...&key=...",
    "code": "<iframe src='http://localhost:5000/widget.html?id=...&key=...' width='400' height='600'></iframe>",
    "enabled": true
  }
}
```

**Widget Integration:**
- ✅ Copy iframe code
- ✅ Paste on your website
- ✅ Chatbot appears as embedded widget

---

### **8️⃣ WIDGET QUERY (Public Endpoint)**

```
POST /api/chatbot/widget/query
Content-Type: application/json

{
  "chatbotId": "...",
  "apiKey": "cb_...",
  "query": "Hello, how can you help?",
  "sessionId": "session-123" // Optional
}

Response:
{
  "response": "Hello! I'm here to help...",
  "sessionId": "session-123"
}
```

**What Happens:**
- ✅ **API Key Authentication**: Widget API key verified
- ✅ **Rate Limiting**: 20 queries/min per IP (production)
- ✅ **Same RAG Process**: Query → Embedding → Search → Response
- ✅ **No Authentication Required**: Public endpoint for widget

---

### **9️⃣ VIEW CONVERSATION HISTORY**

```
GET /api/chatbot/:id/conversations
Authorization: Bearer <token>
Query Params: ?sessionId=session-123 (optional)

Response:
{
  "conversations": [
    {
      "sessionId": "session-123",
      "messages": [
        {
          "role": "user",
          "content": "What is your return policy?",
          "timestamp": "2025-01-01T10:00:00Z"
        },
        {
          "role": "assistant",
          "content": "Our return policy...",
          "timestamp": "2025-01-01T10:00:05Z",
          "metadata": {
            "tokens": 150,
            "responseTime": 1200
          }
        }
      ],
      "messageCount": 2,
      "totalTokens": 300
    }
  ]
}
```

---

### **🔟 MANAGE CHATBOTS**

#### **Get All Chatbots:**
```
GET /api/chatbot
Authorization: Bearer <token>

Response:
{
  "chatbots": [
    {
      "id": "...",
      "name": "My Support Bot",
      "status": "active",
      "trainingData": {
        "totalDocuments": 3,
        "totalChunks": 150,
        "totalSize": 5242880, // 5MB
        "lastTrainedAt": "2025-01-01T10:00:00Z"
      },
      "statistics": {
        "totalQueries": 50,
        "successfulQueries": 48,
        "averageResponseTime": 1200
      }
    }
  ],
  "total": 1
}
```

#### **Get Single Chatbot:**
```
GET /api/chatbot/:id
Authorization: Bearer <token>
```

#### **Delete Chatbot:**
```
DELETE /api/chatbot/:id
Authorization: Bearer <token>

Response:
{
  "message": "Chatbot deleted successfully"
}
```

**What Happens:**
- ✅ ChromaDB collection deleted
- ✅ All conversations deleted
- ✅ Chatbot document removed

---

## 📊 **PLAN-BASED LIMITS**

### **Free Plan (Development Mode)**
| Feature | Limit |
|---------|-------|
| Chatbots | 1 |
| PDF Files per Chatbot | 3 |
| Total Size per Chatbot | 10MB |
| Queries per Hour | 10 |
| Queries per Day | 20 |
| Templates | 1 (single template) |

### **Basic Plan ($9.99/month)**
| Feature | Limit |
|---------|-------|
| Chatbots | 5 |
| PDF Files | Unlimited |
| Total Size | Unlimited |
| Queries per Hour | ~41 |
| Queries per Day | 1,000 |
| Templates | Multiple |

### **Pro Plan ($29.99/month)**
| Feature | Limit |
|---------|-------|
| Chatbots | 10 |
| PDF Files | Unlimited |
| Total Size | Unlimited |
| Queries per Hour | ~125 |
| Queries per Day | 3,000 |
| Templates | Multiple |

### **Enterprise Plan ($99.99/month)**
| Feature | Limit |
|---------|-------|
| Chatbots | Unlimited |
| PDF Files | Unlimited |
| Total Size | Unlimited |
| Queries | Unlimited |
| Templates | Multiple |

---

## 🔐 **AUTHENTICATION & SECURITY**

### **Protected Endpoints:**
- ✅ All chatbot management endpoints require JWT token
- ✅ User can only access their own chatbots
- ✅ API key required for widget queries

### **Rate Limiting:**
- ✅ **Development Mode**: Rate limiting disabled
- ✅ **Production Mode**: Plan-based rate limiting
  - Free: 10 queries/hour
  - Paid: Based on plan limits

### **Input Sanitization:**
- ✅ All user inputs sanitized (HTML, scripts removed)
- ✅ Query sanitization
- ✅ System prompt sanitization

---

## 🗄️ **DATABASE SCHEMA**

### **Chatbot Model:**
```javascript
{
  userId: ObjectId,
  name: String,
  description: String,
  collectionId: String, // ChromaDB collection ID
  status: "active" | "training" | "inactive" | "error",
  trainingData: {
    totalDocuments: Number,
    totalChunks: Number,
    totalSize: Number, // Bytes
    lastTrainedAt: Date,
    trainingStatus: "pending" | "processing" | "completed" | "failed",
    fileTypes: [String]
  },
  config: {
    systemPrompt: String,
    temperature: Number,
    maxTokens: Number,
    topK: Number,
    chunkSize: Number,
    chunkOverlap: Number
  },
  widget: {
    enabled: Boolean,
    apiKey: String, // Unique API key
    theme: {...},
    widgetUrl: String
  },
  statistics: {
    totalQueries: Number,
    successfulQueries: Number,
    failedQueries: Number,
    averageResponseTime: Number,
    lastUsedAt: Date
  }
}
```

### **Conversation Model:**
```javascript
{
  chatbotId: ObjectId,
  userId: ObjectId,
  sessionId: String,
  messages: [
    {
      role: "user" | "assistant" | "system",
      content: String,
      timestamp: Date,
      metadata: {
        tokens: Number,
        responseTime: Number,
        sources: [String] // Chunk IDs
      }
    }
  ],
  messageCount: Number,
  totalTokens: Number,
  status: "active" | "ended"
}
```

---

## 🔧 **TECHNICAL ARCHITECTURE**

### **Components:**
1. **ChromaDB**: Vector database for embeddings storage
2. **OpenAI**: 
   - GPT-3.5-turbo for text generation
   - text-embedding-3-small for embeddings
3. **PDF Processing**: pdf-parse for text extraction
4. **Text Chunking**: Sliding window with overlap
5. **RAG Pipeline**: Query → Embed → Search → Context → Generate

### **Flow Diagram:**
```
User Query
    ↓
Generate Query Embedding
    ↓
Search ChromaDB (Top K similar chunks)
    ↓
Build Context (System Prompt + Retrieved Chunks)
    ↓
Generate AI Response (GPT-3.5)
    ↓
Save Conversation
    ↓
Return Response
```

---

## ✅ **FEATURES SUMMARY**

### **Implemented:**
- ✅ Chatbot creation with templates
- ✅ PDF/TXT file training
- ✅ Raw text training
- ✅ RAG-based querying
- ✅ Widget integration (iframe)
- ✅ Conversation history
- ✅ Plan-based limits
- ✅ Rate limiting
- ✅ Usage tracking
- ✅ Statistics tracking
- ✅ Pre-training data for templates

### **Security:**
- ✅ JWT authentication
- ✅ API key authentication for widgets
- ✅ Input sanitization
- ✅ Rate limiting
- ✅ Plan-based access control

---

## 🚀 **NEXT STEPS**

1. **Upgrade to Paid Plan**: For more chatbots and higher limits
2. **Train Multiple Chatbots**: Upload more PDFs (paid plans)
3. **Customize System Prompt**: Adjust chatbot behavior
4. **Embed Widget**: Add chatbot to your website
5. **Monitor Usage**: Track queries and performance

---

**Last Updated**: January 2025
**Phase**: 3.2 - AI Chatbot Builder
**Status**: ✅ Production Ready


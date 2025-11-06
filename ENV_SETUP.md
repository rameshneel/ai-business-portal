# 🔧 Environment Variables Setup

## Quick Setup for Ollama (Development)

Project root mein `.env` file banayein:

```env
# AI Provider Configuration (Ollama for Development)
EMBEDDING_PROVIDER=ollama
CHAT_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434

# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-business-portal

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# ChromaDB
CHROMADB_URL=http://localhost:8000

# Optional: OpenAI (for production)
# OPENAI_API_KEY=your-openai-api-key
```

## Steps:

1. **Create `.env` file**:

   ```bash
   # Windows PowerShell
   New-Item -Path .env -ItemType File

   # Or manually create .env file in project root
   ```

2. **Add above content** to `.env` file

3. **Make sure Ollama is running**:

   ```bash
   ollama serve
   ```

4. **Pull required models**:

   ```bash
   ollama pull nomic-embed-text
   ollama pull llama2
   ```

5. **Restart server**:
   ```bash
   npm run dev
   ```

## Verify Configuration:

Server start pe aapko console mein dikhna chahiye:

```
🤖 AI Provider Configuration:
   Embeddings: OLLAMA
   Chat: OLLAMA
   Ollama URL: http://localhost:11434
   ⚠️  Make sure Ollama is running: ollama serve
```

## Switch Back to OpenAI:

`.env` file mein change karein:

```env
EMBEDDING_PROVIDER=openai
CHAT_PROVIDER=openai
OPENAI_API_KEY=your-key-here
```

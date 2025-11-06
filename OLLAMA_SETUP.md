# 🦙 Ollama Setup Guide (Local LLM for Development)

Development ke liye Ollama (Local LLM) use kar sakte hain. Ye OpenAI API quota issues se bachne ke liye perfect hai.

## 📋 Prerequisites

1. **Install Ollama**:

   - Windows: Download from https://ollama.ai/download
   - Mac: `brew install ollama`
   - Linux: `curl -fsSL https://ollama.ai/install.sh | sh`

2. **Start Ollama Server**:

   ```bash
   ollama serve
   ```

3. **Download Required Models**:

   ```bash
   # For embeddings
   ollama pull nomic-embed-text

   # For chat (choose based on your RAM):
   ollama pull tinyllama       # ⭐ Smallest: ~637MB RAM (Best for low-memory systems)
   # OR
   ollama pull gemma3:4b       # ~3.3GB RAM (Small alternative, good quality)
   # OR
   ollama pull gemma:2b        # ~2GB RAM (Small, good quality)
   # OR
   ollama pull llama2          # ~4GB RAM (Standard)
   # OR
   ollama pull llama3:8b       # ~5GB RAM (Smaller variant of llama3)
   # OR
   ollama pull mistral         # ~4GB RAM (Alternative)
   # OR
   ollama pull llama3          # ~8GB+ RAM (Full model, requires more memory)

   # ⚠️ Note: If you get "insufficient memory" errors, start with tinyllama
   # ⚠️ Note: phi-2 model is no longer available in Ollama library
   ```

## ⚙️ Environment Variables

`.env` file mein add karein:

```env
# Ollama Configuration
EMBEDDING_PROVIDER=ollama        # Use Ollama for embeddings
CHAT_PROVIDER=ollama             # Use Ollama for chat (optional, defaults to EMBEDDING_PROVIDER)
OLLAMA_BASE_URL=http://localhost:11434

# OpenAI Configuration (keep for production)
# OPENAI_API_KEY=your-openai-key
```

## 🔄 Switching Between Providers

### Development (Ollama):

```env
EMBEDDING_PROVIDER=ollama
CHAT_PROVIDER=ollama
```

### Production (OpenAI):

```env
EMBEDDING_PROVIDER=openai
CHAT_PROVIDER=openai
OPENAI_API_KEY=your-key
```

## 📝 Model Mapping

### Embeddings:

- OpenAI `text-embedding-3-small` → Ollama `nomic-embed-text`
- OpenAI `text-embedding-ada-002` → Ollama `nomic-embed-text`

### Chat:

- OpenAI `gpt-3.5-turbo` → Ollama `tinyllama` (default, smallest)
- OpenAI `gpt-4` → Ollama `tinyllama` (default, smallest)
- OpenAI `gpt-4-turbo` → Ollama `tinyllama` (default, smallest)
- Alternative models: `gemma3:4b`, `llama2`, `llama3` (if you have more RAM)

## ✅ Testing

1. **Check Ollama is Running**:

   ```bash
   curl http://localhost:11434/api/tags
   ```

2. **Create Chatbot**:

   - API se chatbot create karein
   - Embeddings automatically Ollama se generate honge

3. **Train Chatbot**:

   - PDF/TXT files upload karein
   - Training Ollama se embeddings use karegi

4. **Query Chatbot**:
   - Chat queries Ollama se responses generate karengi

## 🚀 Benefits

- ✅ No API costs
- ✅ No rate limits
- ✅ Works offline
- ✅ Fast local processing
- ✅ Privacy (data stays local)

## ⚠️ Notes

- Ollama models require RAM (4GB+ recommended)
- First run pe models download honge (time lagega)
- Performance depends on your hardware
- Production mein OpenAI recommended hai (better quality)

## 🔧 Troubleshooting

### Ollama not connecting:

```bash
# Check if Ollama is running
ollama serve

# Check available models
ollama list

# Test API
curl http://localhost:11434/api/generate -d '{"model":"llama2","prompt":"Hello"}'
```

### Model not found:

```bash
# Pull the required model
ollama pull nomic-embed-text
ollama pull llama2
```

## 📚 More Information

- Ollama Docs: https://github.com/ollama/ollama
- Available Models: https://ollama.ai/library

# NexusFlow Setup Guide (Historical Reference)

> The canonical implementation is `client/` + `server`. This older guide
> contains historical setup notes. Use the root
> `README.md` for current commands.

## 📋 Prerequisites

### System Requirements
- **OS**: Windows, macOS, or Linux
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (or yarn/pnpm)
- **MongoDB**: v5.0+ (local or Atlas)
- **Git**: For version control

### Optional
- **Docker**: For containerized setup
- **VSCode**: Recommended IDE with extensions:
  - ESLint
  - Prettier
  - REST Client
  - Thunder Client (API testing)

---

## 🛠️ Installation Steps

### Step 1: Clone/Initialize Project

```bash
cd D:\inntership\Neuxflow
```

### Step 2: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Update .env with your values
# MONGODB_URI=mongodb://localhost:27017/nexusflow
# PORT=5000
```

### Step 3: MongoDB Setup

#### Option A: Local MongoDB

```bash
# Windows (using MongoDB Community Edition)
mongod

# In another terminal, verify connection
mongo
```

#### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster
3. Get connection string: `mongodb+srv://username:password@cluster.mongodb.net/nexusflow`
4. Update `MONGODB_URI` in `.env`

#### Option C: Docker MongoDB

```bash
# Start MongoDB container
docker run -d \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  --name nexusflow-mongodb \
  mongo:6.0

# Test connection
mongo --host localhost --username admin --password password
```

### Step 4: Start Backend

```bash
cd backend

# Development mode (with hot reload)
npm run dev

# Output should show:
# ✓ Database connected successfully
# ✓ Server running on port 5000
# ✓ WebSocket server ready for connections
```

### Step 5: Frontend Setup

In a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Output should show:
# VITE v4.4.9 ready in 1234 ms
# ➜  Local:   http://localhost:5173/
```

### Step 6: Verify Setup

1. **Backend API**: Visit `http://localhost:5000/api/health`
   - Expected response: `{ "status": "OK", "timestamp": "..." }`

2. **Frontend**: Visit `http://localhost:5173`
   - You should see the NexusFlow UI

3. **WebSocket**: Open browser DevTools Console
   - You should see WebSocket connection established

---

## 🐳 Docker Setup (Alternative)

### Prerequisites
- Docker Desktop installed
- Port 5000, 5173, 27017 available

### Steps

```bash
# Navigate to project root
cd D:\inntership\Neuxflow

# Build and start containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

### Verify
```bash
# Check running containers
docker-compose ps

# Test backend
curl http://localhost:5000/api/health

# Access frontend
# Open browser: http://localhost:5173
```

---

## 🧪 Testing the Setup

### Test 1: Create a Graph

```bash
curl -X POST http://localhost:5000/api/graphs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Graph",
    "description": "Simple test",
    "nodes": [
      {
        "id": "1",
        "type": "datasource",
        "label": "Sensor",
        "config": {},
        "position": { "x": 0, "y": 0 }
      }
    ],
    "edges": []
  }'
```

### Test 2: Ingest Telemetry

```bash
curl -X POST http://localhost:5000/api/telemetry/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor-01",
    "deviceName": "Test Sensor",
    "value": 25.5,
    "unit": "°C"
  }'
```

### Test 3: Query Telemetry

```bash
curl http://localhost:5000/api/telemetry/sensor-01?limit=10
```

---

## 📝 Environment Configuration

### Backend .env

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/nexusflow
MONGODB_TEST_URI=mongodb://localhost:27017/nexusflow-test

# Server
PORT=5000
NODE_ENV=development
LOG_LEVEL=debug

# WebSocket
WEBSOCKET_ORIGINS=http://localhost:3000,http://localhost:5173

# JWT (Future)
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

```

### Frontend .env (optional)

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

---

## 🔧 Common Issues

### Issue: MongoDB Connection Failed

```
Error: connect ECONNREFUSED 127.0.0.1:27017
```

**Solution**:
- Ensure MongoDB is running: `mongod`
- Check `MONGODB_URI` in `.env`
- Use MongoDB Atlas if local setup fails

### Issue: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
```bash
# Find process using port
# Windows
netstat -ano | findstr :5000
# Kill process
taskkill /PID <PID> /F

# Or use different port in .env
PORT=5001
```

### Issue: WebSocket Connection Failed

**Solution**:
- Check backend is running: `http://localhost:5000/api/health`
- Clear browser cache and reload
- Check `WEBSOCKET_ORIGINS` in `.env`

### Issue: npm install fails

```bash
# Clear cache and retry
npm cache clean --force
npm install

# Or use yarn
yarn install
```

---

## 📚 Development Commands

### Backend

```bash
# Development with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Run tests
npm test

# Run linter
npm run lint
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npm run type-check

# Lint
npm run lint
```

---

## 🚀 Deployment

### Backend Deployment (e.g., Heroku)

```bash
cd backend

# Create Procfile
echo "web: npm start" > Procfile

# Deploy
git push heroku main

# Set environment variables
heroku config:set MONGODB_URI=your_atlas_uri
```

### Frontend Deployment (e.g., Vercel)

```bash
cd frontend

# Deploy with Vercel CLI
vercel

# Or via GitHub (recommended)
# Push to GitHub and connect repo to Vercel
```

---

## 📖 Next Steps

1. Read [Architecture Guide](ARCHITECTURE.md)
2. Explore [API Reference](API_REFERENCE.md)
3. Build your first rule in the UI
4. Check [Project README](../README.md)

---

## 💬 Support

- **Issues**: Report in GitHub Issues
- **Discussions**: Use GitHub Discussions
- **Documentation**: See docs/ folder

---

**Happy Developing! 🎉**

# NexusFlow - Visual IoT Telemetry & Rule Engine

> A MERN-based IoT telemetry platform with a visual rule engine for real-time data processing

## 🎯 Project Overview

NexusFlow allows factory floor managers and IoT engineers to:
- **Visually design** complex data pipelines using a drag-and-drop canvas (React Flow)
- **Process high-frequency telemetry** with optimized MongoDB Time-Series collections
- **Execute dynamic rules** in real-time on incoming sensor data using RxJS streams
- **Get instant alerts** via WebSocket when anomalies are detected

## 📁 Project Structure

```
NexusFlow/
├── backend/                # Node.js + Express + MongoDB backend
│   ├── src/
│   │   ├── index.ts       # Main server entry point
│   │   ├── config/        # Database, logger config
│   │   ├── models/        # Mongoose schemas (Graph, Telemetry)
│   │   ├── routes/        # API endpoints
│   │   ├── compiler/      # RxJS graph compiler
│   │   ├── websocket/     # Socket.IO setup
│   │   ├── services/      # Business logic
│   │   └── middleware/    # Express middleware
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/              # React + Vite + React Flow frontend
│   ├── src/
│   │   ├── main.tsx       # React entry point
│   │   ├── App.tsx        # Main component
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API clients
│   │   ├── store/         # Zustand stores
│   │   └── utils/         # Utility functions
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/                  # Documentation
│   ├── ARCHITECTURE.md    # System design
│   ├── API_REFERENCE.md   # API documentation
│   └── SETUP_GUIDE.md     # Setup instructions
│
├── docker-compose.yml     # Docker Compose configuration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB 5.0+ (or Docker)
- npm or yarn

### Setup Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

The backend will start on `http://localhost:5000`

### Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:5173`

### Setup with Docker

```bash
docker-compose up -d
```

This will start MongoDB, backend, and frontend containers.

## � Graph JSON Import / Export

The frontend includes a local graph serialization flow for saving and reusing canvas designs without sending data to the backend.

### Export a graph

1. Build or edit a graph on the NexusFlow canvas.
2. Click the `Export JSON` button in the top toolbar.
3. A `.json` file named like `nexusflow-graph-YYYY-MM-DD.json` will download to your browser.

The export includes the current React Flow node and edge state, including:
- node IDs and types
- node positions and labels
- node configuration/data details
- edge IDs, source, target and connection metadata

### Import a graph

1. Click `Import JSON` in the top toolbar.
2. Choose a previously exported NexusFlow graph file.
3. The canvas will replace the current graph with the imported nodes and edges.

The import checks that the JSON is valid before updating the canvas and shows a friendly error if the file is not a valid NexusFlow graph export.

### Notes
- This is a frontend-only feature; no backend save is performed during export/import.
- Existing Save Graph, Activate Rule, Stop Rule, and dashboard behavior remain unchanged.
- Imported graphs must use supported NexusFlow node types such as datasource, filter, transform, aggregate, and trigger.

## �📚 API Reference

### Graphs API
- `GET /api/graphs` - List all graphs
- `GET /api/graphs/:id` - Get graph by ID
- `POST /api/graphs` - Create new graph
- `PUT /api/graphs/:id` - Update graph
- `DELETE /api/graphs/:id` - Delete graph

### Telemetry API
- `POST /api/telemetry/ingest` - Ingest single telemetry point
- `POST /api/telemetry/batch` - Batch ingest telemetry
- `GET /api/telemetry/:deviceId` - Query telemetry data

### Rules API
- `POST /api/rules/:graphId/activate` - Activate rule
- `POST /api/rules/:graphId/deactivate` - Deactivate rule

## 🏗️ Development Roadmap

### Week 1: Foundation
- [x] Time-Series Setup: MongoDB Time-Series collections
- [x] Express ingestion endpoints
- [x] React app + React Flow canvas scaffolding

### Week 2: Core Logic
- [ ] Stream Compiler: Parse React Flow JSON → RxJS Observables
- [ ] Custom node library (Data Sources, Operations, Triggers)
- [ ] Graph serialization/deserialization

### Week 3: Live Execution
- [ ] WebSocket telemetry ingestion
- [ ] Dynamic rule execution on data streams
- [ ] Live Recharts dashboard

### Week 4: Polish & Integration
- [ ] Webhook/external API triggers
- [ ] Visual feedback (glowing wires)
- [ ] Error handling & logging

## 🔧 Key Technologies

| Layer | Stack |
|-------|-------|
| **Frontend** | React 18, React Flow, Recharts, Tailwind CSS, Zustand, Socket.IO |
| **Backend** | Node.js, Express, Socket.IO, RxJS, TypeScript |
| **Database** | MongoDB 5.0+ (Time-Series collections) |
| **DevTools** | Vite, TypeScript, ESLint, Nodemon |

## 🔌 WebSocket Events

### Client → Server
- `subscribe:telemetry` - Subscribe to device telemetry
- `subscribe:graph` - Subscribe to graph updates
- `emit:telemetry` - Emit telemetry data
- `emit:alert` - Emit alert/trigger

### Server → Client
- `telemetry:update` - New telemetry data
- `alert:triggered` - Alert triggered
- `graph:updated` - Graph changes

## 📝 Example: Create & Execute a Rule

1. **Create a graph** (POST /api/graphs):
```json
{
  "name": "Temperature Alert",
  "description": "Alert when temp > 80°C",
  "nodes": [
    { "id": "1", "type": "datasource", "label": "Temperature Sensor" },
    { "id": "2", "type": "filter", "label": "> 80°C" },
    { "id": "3", "type": "trigger", "label": "SMS Alert" }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" }
  ]
}
```

2. **Activate the rule** (POST /api/rules/{graphId}/activate):
```json
{
  "graphId": "66c1a2b3c4d5e6f7g8h9i0j1"
}
```

3. **Ingest telemetry** (POST /api/telemetry/ingest):
```json
{
  "deviceId": "turbine-01",
  "deviceName": "Main Turbine",
  "value": 85,
  "unit": "°C"
}
```

4. **Get alert** (via WebSocket):
```json
{
  "event": "alert:triggered",
  "data": {
    "graphId": "66c1a2b3c4d5e6f7g8h9i0j1",
    "message": "Temperature exceeded threshold",
    "severity": "error"
  }
}
```

## 🧪 Testing

### Backend
```bash
cd backend
npm test
npm run lint
```

### Frontend
```bash
cd frontend
npm run build
npm run type-check
```

## 📖 Documentation

See detailed documentation in the `docs/` folder:
- [Architecture](docs/ARCHITECTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Setup Guide](docs/SETUP_GUIDE.md)

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Your Name** - Internship Project @ [Company]

---

**Happy Building! 🚀**

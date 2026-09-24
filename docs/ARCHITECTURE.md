# NexusFlow Architecture

## System Overview

NexusFlow is a distributed system with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ React Flow Canvas                                │  │
│  │ - Drag & drop node-based UI                      │  │
│  │ - Real-time graph visualization                  │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Live Dashboard (Recharts)                        │  │
│  │ - Streaming telemetry visualization              │  │
│  │ - Real-time alerts                               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
           │                              │
      REST API                        WebSocket
        (Axios)                        (Socket.IO)
           │                              │
┌──────────────────────────────────────────────────────────┐
│              Node.js Express Backend                      │
│  ┌─────────────────────────────────────────────────┐   │
│  │ HTTP Routes                                     │   │
│  │ - GET/POST /graphs                             │   │
│  │ - POST /telemetry/ingest                       │   │
│  │ - POST /rules/:id/activate                     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ WebSocket Events (Socket.IO)                    │   │
│  │ - Telemetry streaming                          │   │
│  │ - Alert broadcasting                           │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Stream Compiler & RxJS Engine                   │   │
│  │ - Parse React Flow JSON                        │   │
│  │ - Compile to Observables                       │   │
│  │ - Execute dynamic rules on streams             │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
           │
    MongoDB Driver
           │
┌──────────────────────────────────────────────────────────┐
│         MongoDB (Time-Series Collections)                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Graphs Collection                               │   │
│  │ - Node definitions                             │   │
│  │ - Edge connections                             │   │
│  │ - Metadata & versions                          │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ Telemetry Time-Series                          │   │
│  │ - Optimized for high-frequency writes          │   │
│  │ - Automatic data retention (30 days)           │   │
│  │ - Compression & indexing                       │   │
│  └─────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Component Hierarchy
```
App
├── Sidebar (Node Library)
├── Canvas (React Flow)
│   ├── Nodes
│   ├── Edges
│   ├── Background
│   └── Controls
├── NodeInspector (Properties Panel)
└── Dashboard (Live Metrics)
```

### State Management (Zustand)
- `graphStore`: Centralized graph CRUD operations
- Local component state for UI interactions
- WebSocket events for real-time updates

### Service Layer
- `graphService`: API communication for graphs
- `telemetryService`: Telemetry ingestion & querying
- `useWebSocket`: Custom hook for Socket.IO integration

## Backend Architecture

### Layered Architecture

**Controller/Routes Layer**
- Express route handlers
- Request validation
- Response formatting

**Service Layer**
- Business logic
- Graph compilation
- Rule execution

**Data Layer**
- Mongoose models
- MongoDB queries
- Time-series optimization

**Event Layer**
- Socket.IO server
- Real-time event broadcasting
- Client subscriptions

### Data Flow: Rule Execution

1. **Graph Definition** (React Flow UI)
   - User creates visual graph
   - Serialized to JSON

2. **Graph Persistence** (MongoDB)
   - Stored in `graphs` collection
   - Versioning & metadata

3. **Compilation** (Stream Compiler)
   - JSON → RxJS Observable graph
   - Operator pipeline setup

4. **Activation** (Rule Engine)
   - Graph compiled into memory
   - Subscriptions created
   - Ready for data streams

5. **Execution** (On Data Arrival)
   - Telemetry received via WebSocket/API
   - Streams through compiled graph
   - Operations executed in sequence
   - Output triggers alerts

6. **Broadcasting** (Socket.IO)
   - Alert events sent to clients
   - Dashboard updates in real-time
   - Subscribed clients receive updates

## Database Schema

### Graphs Collection
```typescript
{
  _id: ObjectId,
  name: String,
  description: String,
  nodes: [
    {
      id: String,
      type: 'datasource' | 'operation' | 'filter' | 'transform' | 'trigger',
      label: String,
      config: Object,
      position: { x: Number, y: Number }
    }
  ],
  edges: [
    {
      id: String,
      source: String,
      target: String
    }
  ],
  isActive: Boolean,
  version: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Telemetry Time-Series
```typescript
{
  _id: ObjectId,
  timestamp: Date,          // Time-series field
  deviceId: String,         // Indexed
  deviceName: String,
  value: Number,
  unit: String,
  metadata: Object          // Meta field
}
```

## RxJS Stream Compilation

### Example: Temperature Alert Graph

**Visual Graph:**
```
Sensor → Filter (>80°C) → Trigger (SMS)
```

**Compiled RxJS Code:**
```typescript
source$
  .pipe(
    // Filter nodes
    filter(data => data.value > 80),
    // Transform: prepare message
    map(data => ({
      alert: true,
      message: `Temp exceeded: ${data.value}°C`,
      timestamp: new Date()
    })),
    // Trigger: send SMS
    tap(alert => smsSender.send(alert))
  )
  .subscribe(
    alert => io.emit('alert:triggered', alert),
    error => logger.error('Rule execution error', error)
  );
```

## Scalability Considerations

### High-Frequency Ingestion
- **MongoDB Time-Series**: Optimized for 5000+ writes/sec
- **Batch API**: Process multiple points in single request
- **Connection pooling**: Reuse database connections

### Real-Time Streaming
- **RxJS backpressure**: Handle fast producers
- **Socket.IO rooms**: Efficient subscriber management
- **Memory buffering**: Limited queue sizes

### Data Retention
- **TTL indexes**: Automatic cleanup (30 days default)
- **Archival strategy**: Move old data to cold storage
- **Compression**: MongoDB native compression

## Security Considerations

### Future Enhancements
- JWT authentication for API endpoints
- Role-based access control (RBAC)
- Input validation & sanitization
- Rate limiting on ingestion endpoints
- Encrypted WebSocket connections
- Audit logging for rule changes

## Performance Metrics

### Targets
- Ingestion: 5000+ telemetry points/sec
- Latency: <100ms for rule execution
- Concurrent users: 50+
- Graph complexity: 100+ nodes/graph

### Optimization
- Database indexing on deviceId, timestamp
- Query result caching
- Connection pooling
- Memory-efficient RxJS operators

# API Reference

## Base URL
- **Development**: `http://localhost:5000/api`
- **Production**: `https://api.nexusflow.app/api`

## Authentication
Currently, endpoints are not authenticated. JWT will be added in v1.1.

---

## Graphs API

### List All Graphs
```http
GET /graphs
```

**Response**: 200 OK
```json
{
  "success": true,
  "data": [
    {
      "_id": "66c1a2b3c4d5e6f7g8h9i0j1",
      "name": "Temperature Alert",
      "description": "Alert when temp > 80°C",
      "nodes": [...],
      "edges": [...],
      "isActive": false,
      "version": 1,
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### Get Graph by ID
```http
GET /graphs/:id
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| id | string | Graph ID |

**Response**: 200 OK
```json
{
  "success": true,
  "data": { /* Graph object */ }
}
```

### Create Graph
```http
POST /graphs
Content-Type: application/json
```

**Request Body**:
```json
{
  "name": "Temperature Alert",
  "description": "Alert when temp > 80°C",
  "nodes": [
    {
      "id": "1",
      "type": "datasource",
      "label": "Temperature Sensor",
      "config": { "deviceId": "temp-01" },
      "position": { "x": 0, "y": 0 }
    },
    {
      "id": "2",
      "type": "filter",
      "label": "Filter > 80",
      "config": { "operator": ">", "threshold": 80 },
      "position": { "x": 200, "y": 0 }
    },
    {
      "id": "3",
      "type": "trigger",
      "label": "SMS Alert",
      "config": { "phoneNumber": "+1234567890" },
      "position": { "x": 400, "y": 0 }
    }
  ],
  "edges": [
    { "id": "e1-2", "source": "1", "target": "2" },
    { "id": "e2-3", "source": "2", "target": "3" }
  ]
}
```

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "_id": "66c1a2b3c4d5e6f7g8h9i0j1",
    "name": "Temperature Alert",
    /* ...full graph object */
  }
}
```

### Update Graph
```http
PUT /graphs/:id
Content-Type: application/json
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| id | string | Graph ID |

**Request Body**: Same as Create Graph

**Response**: 200 OK

### Delete Graph
```http
DELETE /graphs/:id
```

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Graph deleted successfully"
}
```

---

## Telemetry API

### Ingest Single Telemetry Point
```http
POST /telemetry/ingest
Content-Type: application/json
```

**Request Body**:
```json
{
  "deviceId": "turbine-01",
  "deviceName": "Main Turbine",
  "value": 75.5,
  "unit": "°C",
  "metadata": {
    "location": "Factory Floor A",
    "status": "running"
  }
}
```

**Response**: 201 Created
```json
{
  "success": true,
  "data": {
    "_id": "66c1a3b4c5d6e7f8g9h0i1j2",
    "deviceId": "turbine-01",
    "timestamp": "2024-01-15T10:35:00Z",
    "value": 75.5,
    "unit": "°C"
  }
}
```

### Batch Ingest Telemetry
```http
POST /telemetry/batch
Content-Type: application/json
```

**Request Body**:
```json
[
  {
    "deviceId": "turbine-01",
    "deviceName": "Main Turbine",
    "value": 75.5,
    "unit": "°C"
  },
  {
    "deviceId": "turbine-02",
    "deviceName": "Secondary Turbine",
    "value": 78.2,
    "unit": "°C"
  }
]
```

**Response**: 201 Created
```json
{
  "success": true,
  "count": 2,
  "data": [...]
}
```

### Query Telemetry
```http
GET /telemetry/:deviceId?from=2024-01-15T00:00:00Z&to=2024-01-15T23:59:59Z&limit=100
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| deviceId | string | Device ID |
| from | ISO 8601 | Start timestamp (optional) |
| to | ISO 8601 | End timestamp (optional) |
| limit | number | Max results (default: 100) |

**Response**: 200 OK
```json
{
  "success": true,
  "count": 50,
  "data": [
    {
      "_id": "66c1a3b4c5d6e7f8g9h0i1j2",
      "deviceId": "turbine-01",
      "deviceName": "Main Turbine",
      "timestamp": "2024-01-15T10:35:00Z",
      "value": 75.5,
      "unit": "°C"
    }
  ]
}
```

---

## Rules API

### Activate Rule
```http
POST /rules/:graphId/activate
```

**Parameters**:
| Name | Type | Description |
|------|------|-------------|
| graphId | string | Graph ID to activate |

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Rule activation initiated"
}
```

### Deactivate Rule
```http
POST /rules/:graphId/deactivate
```

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Rule deactivated"
}
```

---

## WebSocket Events

### Subscribe to Telemetry
**Client → Server**:
```javascript
socket.emit('subscribe:telemetry', { deviceId: 'turbine-01' });
```

**Server → Client** (when data arrives):
```javascript
socket.on('telemetry:update', (data) => {
  console.log('New telemetry:', data);
  // { deviceId: 'turbine-01', value: 75.5, timestamp: ... }
});
```

### Subscribe to Graph Updates
**Client → Server**:
```javascript
socket.emit('subscribe:graph', { graphId: '66c1a2b3c4d5e6f7g8h9i0j1' });
```

### Emit Telemetry
**Client → Server**:
```javascript
socket.emit('emit:telemetry', {
  deviceId: 'turbine-01',
  deviceName: 'Main Turbine',
  value: 75.5,
  unit: '°C'
});
```

### Receive Alerts
**Server → Client**:
```javascript
socket.on('alert:triggered', (alert) => {
  console.log('Alert received:', alert);
  // { graphId, message, severity, timestamp, data }
});
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid request body"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Graph not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "Internal server error",
  "stack": "..." // Only in development
}
```

---

## Rate Limiting

Coming in v1.1:
- 1000 requests/minute per IP for public endpoints
- 5000 telemetry points/sec per device

---

## Changelog

**v1.0 (Current)**
- Basic CRUD for graphs
- Telemetry ingestion & querying
- WebSocket streaming
- Single-threaded rule execution

**v1.1 (Planned)**
- JWT authentication
- Role-based access control
- Rate limiting
- Webhook integration
- Multi-tenant support

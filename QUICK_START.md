# NexusFlow - Historical Quick Start Guide

> Use the root `README.md` for the current `client/` + `server` commands. This
> document predates the canonical implementation cleanup.

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- ✅ Backend running on port 5000
- ✅ Frontend running on port 5174
- ✅ Modern web browser

### Quick Access
**Open browser to**: http://localhost:5174

---

## 📚 Tutorial: Create Your First Rule

### Example 1: Simple Temperature Alert

#### Create the Rule
1. **Add Datasource Node**
   - Click 📊 Datasource from left sidebar
   - In right panel, set:
     - Device ID: `turbine-01`
     - Device Name: `Turbine Sensor`
     - Interval (ms): `1000`
     - Unit: `°C`

2. **Add Filter Node**
   - Click 🔍 Filter from left sidebar
   - Connect Datasource → Filter (drag edge)
   - Configure Filter:
     - Operator: `>`
     - Threshold: `50`

3. **Add Trigger Node**
   - Click 🚨 Trigger from left sidebar
   - Connect Filter → Trigger
   - Configure Trigger:
     - Action Type: `log` or `webhook`
     - Message: `Temperature exceeded 50°C`

#### Activate & Monitor
1. Click **"Save Graph"** button (top right)
2. Click **"Activate Rule"** button
3. Watch dashboard in right panel for real-time data
4. View alerts in alert panel

#### Test
1. Click **"Generate Mock Data"** to inject test data
2. Observe filtered events in real-time
3. See alerts trigger when threshold exceeded

---

## 🎮 UI Overview

### Left Panel: Node Library
- **Nodes Tab**: 5 ready-to-use node types
  - 📊 Datasource - Sensor input
  - 🔍 Filter - Apply conditions
  - ⚙️ Transform - Math operations
  - 📈 Aggregate - Moving average
  - 🚨 Trigger - Send alerts
- **Tools Tab**: Mock data generator
- **Help Tab**: Getting started guide

### Center: Canvas
- Drag nodes onto canvas
- Connect with edges
- Click nodes to select
- See execution flow

### Right Panel: Configuration
- **Inspector**: Edit selected node properties
- **Dashboard**: Real-time telemetry visualization

### Top Bar: Actions
- 💾 Save Graph
- ▶️ Activate Rule / ⏹️ Stop Rule

---

## ⚙️ Node Configuration Guide

### Datasource (📊)
```
Device ID: turbine-01
Device Name: Turbine Sensor
Interval (ms): 1000
Unit: °C
```
→ Generates simulated sensor data every 1000ms

### Filter (🔍)
```
Operator: >, <, >=, <=, ==, !=
Threshold: 50
```
→ Only passes values matching condition

### Transform (⚙️)
```
Operation: multiply, divide, add, subtract, sqrt, abs
Value: 2
```
→ Applies math operation to all values

### Aggregate (📈)
```
Window: 10
Type: average, min, max, sum
```
→ Calculates over last 10 values

### Trigger (🚨)
```
Type: log, webhook, email, sms, websocket
URL: https://example.com/alert
Message: Alert message text
```
→ Executes action when data flows through

---

## 📊 Dashboard Features

### Stats Panel
```
┌─────────────────────────────────────┐
│ Avg Value: 45.2°C                   │
│ Current: 48.5°C                     │
│ Max: 60.1°C                         │
│ Alerts: 5                           │
└─────────────────────────────────────┘
```

### Charts
- **Select Chart Type**: Line, Area, Bar
- **Select Device**: All, turbine-01, turbine-02, pump-01
- **Auto-refresh**: Every 200ms

### Alerts
- Real-time alert notifications
- Color-coded by severity (red/yellow/blue)
- Timestamp and value included

---

## 🧪 Common Workflows

### Workflow 1: Monitor Multiple Devices
```
Datasource (turbine-01)
    ↓
Filter (temp > 70)
    ↓
Trigger (log)

+ Datasource (turbine-02)
    ↓
Filter (temp > 70)
    ↓
Trigger (log)
```

### Workflow 2: Moving Average
```
Datasource
    ↓
Filter (any values)
    ↓
Aggregate (window: 10, type: average)
    ↓
Filter (avg > 50)
    ↓
Trigger (alert)
```

### Workflow 3: Value Scaling
```
Datasource (raw values 0-100)
    ↓
Transform (multiply by 3.6)
    ↓
Transform (add 273.15)
    ↓
Trigger (send webhook)
```

---

## 🎯 Pro Tips

1. **Use Mock Data to Test**
   - Click "Generate Mock Data" to quickly test rules
   - No need to wait for real sensor data

2. **Configure by Node Type**
   - Each node type has specific fields
   - Left panel shows description for each type

3. **Chain Operations**
   - Filter → Filter → Filter for complex logic
   - Transform → Aggregate → Trigger for processing

4. **Monitor in Real-time**
   - Dashboard updates automatically
   - No refresh needed

5. **Save Often**
   - Click "Save Graph" before activation
   - Allows reusing rule configurations

6. **Test Locally First**
   - Use mock data and localhost
   - Deploy to production when tested

---

## 🔧 Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Delete Node | Select + Delete key |
| Duplicate | Ctrl+D (in Inspector) |
| Pan Canvas | Drag middle-mouse |
| Zoom Canvas | Scroll wheel |
| Fit View | Ctrl+Shift+1 |

---

## 🚨 Troubleshooting Quick Fixes

### Rule won't activate
- ✅ Check that nodes are connected
- ✅ Click "Save Graph" first
- ✅ Check console for errors

### No data showing
- ✅ Click "Generate Mock Data"
- ✅ Check device name matches
- ✅ Verify interval is not 0

### Alerts not firing
- ✅ Make sure you have a Trigger node
- ✅ Connect Trigger in the chain
- ✅ Check threshold values

### WebSocket not connecting
- ✅ Verify backend running on :5000
- ✅ Refresh browser page
- ✅ Check browser console for errors

---

## 📈 API Examples

### Activate Rule via API
```bash
curl -X POST http://localhost:5000/api/rules/rule-1/activate \
  -H "Content-Type: application/json" \
  -d '{
    "graph": {
      "name": "My Rule",
      "nodes": [...],
      "edges": [...]
    }
  }'
```

### Get Active Rules
```bash
curl http://localhost:5000/api/rules
```

### Ingest Telemetry
```bash
curl -X POST http://localhost:5000/api/telemetry/ingest \
  -H "Content-Type: application/json" \
  -d '{
    "deviceId": "sensor-01",
    "value": 42.5,
    "unit": "°C"
  }'
```

---

## 🎓 Understanding the Concepts

### Nodes
Think of nodes as **functions in a pipeline**:
- Input → Process → Output
- Each node has configuration
- Connected in sequence

### Edges
**Connections** between nodes showing data flow:
- Draw from output (right) to input (left)
- Create pipelines of operations
- Can branch to multiple nodes

### Streams
Continuous flow of data over time:
- Updates happen in real-time
- Operators transform data
- Triggers execute on matching data

### Rules
Complete graph ready for execution:
- Compile to RxJS observables
- Execute against telemetry streams
- Generate alerts on conditions

---

## 🚀 Next Steps

1. **Create Your First Rule** (5 min)
   - Follow Example 1 above

2. **Explore All Node Types** (10 min)
   - Try each node configuration

3. **Test with Mock Data** (5 min)
   - Generate data and verify rule works

4. **Build Complex Rules** (20 min)
   - Chain multiple operations
   - Create advanced workflows

5. **Deploy to Production** (next step)
   - See PROJECT_COMPLETE.md for deployment

---

## 💡 Example Rules to Try

### Rule: Temperature Safety Alert
```
✓ Datasource (temp sensor)
✓ Filter (> 80°C)
✓ Trigger (send alert)
```

### Rule: Anomaly Detection
```
✓ Datasource (sensor data)
✓ Aggregate (10-value moving average)
✓ Filter (> avg + 2*stddev)
✓ Trigger (log anomaly)
```

### Rule: Data Normalization
```
✓ Datasource (raw sensor 0-1024)
✓ Transform (divide by 10.24)
✓ Transform (round)
✓ Trigger (store/display)
```

---

## 📞 Need Help?

- Check dashboard in right panel
- Review browser console (F12)
- See PROJECT_COMPLETE.md for full docs
- Check backend logs: `backend/logs/`

---

**Ready to go?** Open http://localhost:5174 and start building! 🎉

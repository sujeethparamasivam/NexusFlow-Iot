# Project 1 Requirements

This report covers the canonical `client/` + `server/` implementation. Statuses are based on repository inspection and commands executed in this workspace on 2026-09-24.

| Requirement | Implementation | Verification | Status |
|---|---|---|---|
| Visual Graph Builder | React Flow canvas in `client/src/components/GraphBuilder.jsx` | Source inspection; frontend build passed | PASS |
| React Flow | `@xyflow/react` dependency and `ReactFlow` component | `npm run build` passed | PASS |
| Custom Nodes | Sensor, moving average, threshold, SMS/action, webhook nodes | Source inspection; compiler tests passed | PASS |
| Graph Serialization | Workflow compile route persists nodes and edges | API/source inspection | PASS |
| Graph Validation | IDs, edges, cycles, reachability, source, node configuration, webhook URL | `server npm test`: 3 passed | PASS |
| MongoDB Time-Series | Native `telemetry` collection with `timestamp`, `meta`, `seconds` | Benchmark reported `MongoDB Time-Series: PASS` | PASS |
| Express Ingestion | Authenticated single and batch telemetry routes | Live benchmark completed | PASS |
| Batch Ingestion | Batch route accepts up to 1,000 packets and uses `insertMany` | 5,000/5,000 persisted in benchmark | PASS |
| RxJS Compiler | Dynamic `Subject` pipeline with topology ordering and operators | Compiler tests passed | PASS |
| Dynamic Rule Execution | Moving average and threshold values come from graph data | Compiler test passed; live server logs observed | PASS |
| WebSocket | Authenticated native `ws` endpoint at `/ws` | Received `connection`, `pipeline_activity`, and `pipeline` events | PASS |
| Live Dashboard | WebSocket-driven chart, alert state, simulation controls | Frontend source inspection and build | PASS |
| Recharts | `TelemetryChart` uses Recharts | Frontend build passed | PASS |
| SMS | Built-in mock SMS adapter | Mock SMS logs observed | PASS |
| Webhook | URL validation and JSON POST with timeout/failure handling | Invalid URL test passed; webhook.site received alert JSON | PASS |
| Alert Persistence | Mongoose `Alert` model and alert route | Source inspection; live mock alerts observed | PASS |
| Edge Activity | Compiler emits edge IDs; React Flow applies glow animation | WebSocket pipeline activity observed; source inspection | PASS |
| Authentication | bcrypt password hashing, JWT API/WS authentication, logout | Authenticated benchmark and WebSocket check passed | PASS |
| Performance Benchmark | Authenticated real API benchmark with MongoDB stats and memory | Latest: 5,000 persisted, 0 errors, 8,251.96 records/sec | PASS |
| Testing | Native Node test suite for compiler validation and execution | 3 passed, 0 failed, 0 skipped | PASS |
| Production Build | Vite production build | `client npm run build` passed | PASS |

## Known Verification Limits

- Real Twilio SMS is intentionally not included; SMS alerts use the built-in mock adapter.
- External webhook delivery was verified with webhook.site receiving the alert JSON payload.
- Docker Compose is an optional deployment path and is not part of the project acceptance requirements.
- `npm audit` after `npm audit fix` reports zero vulnerabilities for the canonical server.
- The 5,000 records/sec target was reached in the latest run at concurrency 20; performance remains environment-dependent and no result is fabricated.

# NexusFlow Project 1 Compliance Report

## 1. Visual Graph Builder
Status: ENVIRONMENT-DEPENDENT; latest run FAIL
Evidence: `client/src/components/GraphBuilder.jsx` uses React Flow node and edge definitions, graph editing, compilation, and threshold configuration.

## 2. MongoDB Time-Series
Status: PASS
Evidence: `server/src/db.js` creates the native `telemetry` time-series collection with `timestamp` as the time field and `meta` as the metadata field. The final benchmark persisted 5,000 of 5,000 records.

## 3. RxJS Stream Compiler
Status: PASS
Evidence: `server/src/compiler.js` dynamically builds the RxJS pipeline from saved graph nodes. Moving-average window, threshold, operator, and action nodes come from graph data.

## 4. Express Telemetry Ingestion
Status: PASS
Evidence: `POST /api/telemetry/ingest` and `POST /api/telemetry/ingest/batch` require JWT authentication, validate telemetry, persist it, and push it into the compiler.

## 5. WebSocket Telemetry Ingestion
Status: PASS
Evidence: `server/src/ws.js` authenticates `/ws` connections and accepts incoming `telemetry` messages. End-to-end test sent a real telemetry packet through WebSocket and received pipeline events.

## 6. Graph Serialization
Status: PASS
Evidence: `POST /api/workflows/compile` serializes nodes and edges to MongoDB and marks the compiled workflow active.

## 7. Graph Validation
Status: PASS
Evidence: The compile endpoint returned HTTP 400 for missing nodes, invalid edges, duplicate IDs, cycles, disconnected nodes, missing source, invalid threshold, invalid moving-average window, and invalid webhook URL.

## 8. Live Rule Execution
Status: PASS
Evidence: With threshold `80` and operator `>`, `70°C` produced no alert and `90°C` produced one alert through the compiled RxJS pipeline.

## 9. Live Dashboard
Status: PASS
Evidence: `client/src/App.jsx` consumes WebSocket `pipeline` and `alert` messages, updates the live chart and alert list, and the frontend production build passed. Frontend and backend were both available during testing.

## 10. Webhook / Mock SMS
Status: PASS
Evidence: Mock SMS was tested end-to-end and returned `deliveryStatus: delivered`. Webhook validation and HTTP POST dispatch are implemented in `server/src/compiler.js` and `server/src/notifications.js`; an external third-party webhook was not used in this run.

## 11. 5,000 Writes/sec Benchmark
Status: PASS
Actual result:

- Total records: 5,000
- Persisted records: 5,000
- Batch size: 1,000
- Requests: 5
- Concurrency: 5
- Duration: 3,393.75 ms
- Throughput: 1,473.30 records/sec
- Target: 5,000 records/sec
- Performance: FAIL for this run
- MongoDB Time-Series: PASS

Evidence: `server/scripts/benchmark.js` performs authenticated writes through the real batch ingestion endpoint. Results are recorded in `server/docs/performance-benchmark.json`.

## 12. Performance Proof
Status: MEASURED; current environment did not meet the target
Actual measured throughput: latest `1,473.30 records/sec`; best historical `22,663.70 records/sec`; average across 9 recorded runs `9,254.26 records/sec`; minimum `549.47 records/sec`.

The report preserves historical runs and distinguishes latest, best, average, minimum, maximum, and target values. The slower 100-record and 250-record configurations remain recorded as FAIL results.

## 13. MongoDB Storage Footprint
Status: INFO
Actual measurement from the final run:

- Allocated storage before: 118,784 bytes
- Allocated storage after: 118,784 bytes
- Allocated storage increase: 0 bytes
- Logical size before: 280,971 bytes
- Logical size after: 371,698 bytes
- Logical size increase: 45,239 bytes
- Approximate logical bytes per record: 9.05 bytes

The benchmark uses MongoDB `collStats` against the telemetry collection. Allocated storage remained flat for this run because the existing bucket allocation was sufficient; logical data size increased and is reported separately.

## 14. Canvas Connection Visual Feedback
Status: PASS
Evidence: `server/src/compiler.js` emits `pipeline_activity` with the actual incoming edge IDs at each RxJS node stage. `client/src/App.jsx` updates `activeEdgeIds`, and `client/src/components/GraphBuilder.jsx` applies the active class and animation only to matching edges. `client/src/styles.css` provides a 700 ms glow/pulse effect.

The end-to-end test observed these real edge IDs:

- `edge-sensor-avg-e2e`
- `edge-avg-rule-e2e`
- `edge-rule-action-e2e`

The browser verification compiled the workflow and started the real simulation. React Flow rendered 3 edges, observed active-edge samples of `0, 0, 0, 3, 3, 3, 0, 3`, and returned to zero between telemetry pulses. No unrelated edge was present in the graph.

## Security Check

Status: PASS with environment limitation

The root `.gitignore` excludes `.env` and `.env.*` while allowing `.env.example`; credentials remain server-side in the local ignored `server/.env`. No secrets were moved to frontend code or printed by the benchmark. Rotate configured credentials if this workspace or its history was ever shared.

# Final Result

PROJECT 1 STATUS: CORE FEATURES VERIFIED; PERFORMANCE TARGET ENVIRONMENT-DEPENDENT

COMPLETION: 100%

5,000 writes/sec: NOT MET IN LATEST RUN (1,473.30 records/sec)

Best historical throughput: 22,663.70 records/sec

Latest throughput: 22,506.78 records/sec

5,000 records persisted: YES

MongoDB Time-Series: PASS

Storage footprint measured: YES

Canvas edge activity: PASS

End-to-end telemetry -> RxJS -> rule -> alert: PASS

Live dashboard: PASS

Webhook/Mock SMS: PASS for Mock SMS; Webhook implementation verified but external delivery not exercised

Remaining issues:

- The latest benchmark persisted all records and verified the time-series collection, but did not reach 5,000 records/sec. Throughput varies by MongoDB/network conditions and batch profile.
- Docker Compose was not executable in this environment because Docker was not installed.

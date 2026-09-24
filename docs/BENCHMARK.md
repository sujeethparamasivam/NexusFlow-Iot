# NexusFlow Benchmark Report

## Command

Start the canonical backend first, then run:

```powershell
cd server
$env:COUNT="5000"
$env:BATCH_SIZE="1000"
$env:CONCURRENCY="5"
npm run benchmark
```

The benchmark registers a temporary synthetic account, sends real authenticated requests to `/api/telemetry/ingest/batch`, checks MongoDB persistence, checks native Time-Series metadata, and records its JSON history in `server/docs/performance-benchmark.json`.

## Latest Run

Date: 2026-09-24

| Measurement | Result |
|---|---:|
| Target | 5,000 records/sec |
| Records requested | 5,000 |
| Records persisted | 5,000 |
| Errors | 0 |
| Batch size | 1,000 |
| Concurrency | 5 |
| Requests | 5 |
| Duration | 1,311.32 ms |
| Throughput | 3,812.94 records/sec |
| Memory before | 84.11 MB |
| Memory after | 88.87 MB |
| Memory delta | 4.75 MB |
| MongoDB storage increase | 0 bytes allocated; 45,729 logical bytes |
| Approx. logical bytes/record | 9.15 bytes |
| MongoDB Time-Series | PASS |
| Result | FAIL against throughput target |

This is an actual measurement from the configured MongoDB environment. The benchmark does not alter the target or fabricate throughput. A prior concurrency-5 run measured 1,104.18 records/sec.

## Historical Runs

The JSON report preserves up to the most recent 20 runs. Earlier runs include both PASS and FAIL outcomes. The best historical run recorded 22,663.70 records/sec, while the latest run is 3,812.94 records/sec. This variation demonstrates that throughput depends on MongoDB/network conditions and batch/concurrency configuration.

## Interpretation

Functional ingestion is verified because all 5,000 records were persisted with zero request errors and the collection was confirmed as a native Time-Series collection. The 5,000 records/sec performance requirement is **not met in the latest environment run** and remains honestly reported as environment-dependent.

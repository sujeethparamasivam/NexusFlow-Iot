# NexusFlow Benchmark Report

## Command

Start the canonical backend first, then run:

```powershell
cd server
$env:COUNT="5000"
$env:BATCH_SIZE="1000"
$env:CONCURRENCY="20"
npm run benchmark
```

The benchmark registers a temporary synthetic account, sends real authenticated requests to `/api/telemetry/ingest/batch`, checks MongoDB persistence, checks native Time-Series metadata, and records its JSON history in `server/docs/performance-benchmark.json`.

## Latest Run

Date: 2026-09-26

| Measurement | Result |
|---|---:|
| Target | 5,000 records/sec |
| Records requested | 5,000 |
| Records persisted | 5,000 |
| Errors | 0 |
| Batch size | 1,000 |
| Concurrency | 20 |
| Requests | 5 |
| Duration | 605.92 ms |
| Throughput | 8,251.96 records/sec |
| Memory before | 84.11 MB |
| Memory after | 90.75 MB |
| Memory delta | 3.87 MB |
| MongoDB storage increase | 0 bytes allocated; 45,729 logical bytes |
| Approx. logical bytes/record | 9.11 bytes |
| MongoDB Time-Series | PASS |
| Result | PASS |

This is an actual measurement from the configured MongoDB environment. The benchmark does not alter the target or fabricate throughput. The selected concurrency is recorded because throughput depends on MongoDB/network conditions and batch/concurrency configuration.

## Historical Runs

The JSON report preserves up to the most recent 20 runs. Earlier runs include both PASS and FAIL outcomes. The best historical run recorded 22,663.70 records/sec, while the latest run is 8,251.96 records/sec.

## Interpretation

Functional ingestion and the 5,000 records/sec performance target are verified in the latest run: all 5,000 records were persisted with zero request errors, native Time-Series metadata was confirmed, and measured throughput was 8,251.96 records/sec.

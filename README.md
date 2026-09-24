# NexusFlow — Visual IoT Telemetry & Rule Engine

NexusFlow is Project 1 from the Infotact Solutions Advanced MERN Stack Engineering document.

## Required technology implemented
- Frontend: React + React Flow
- Backend: Node.js + Express
- Stream compiler: RxJS
- Database: MongoDB 5.0+ Time-Series collection
- Real-time transport: WebSockets (`ws`)
- Live dashboard: Recharts
- API client: Axios
- UI: premium responsive dark enterprise interface

## Core flow
Turbine Sensor → Moving Average Filter → Threshold Rule → SMS Alert

The backend accepts telemetry, stores it in MongoDB Time-Series storage, pushes the value over WebSocket, and evaluates the saved React Flow graph through an RxJS pipeline. When the rule is true, a mock SMS alert is emitted.

## Requirements
- Node.js 20+
- MongoDB 5.0+
- npm

## Setup

### 1. Backend
```bash
cd server
npm install
copy .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017
DB_NAME=nexusflow
CLIENT_URL=http://localhost:5173
JWT_SECRET=replace_with_a_long_random_secret
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_FROM_NUMBER=your_twilio_phone_number
EMAIL_USER=your.gmail@gmail.com
EMAIL_APP_PASSWORD=your_16_character_gmail_app_password
TELEGRAM_BOT_TOKEN=your_bot_token
```

Start:
```bash
npm run dev
```

### 2. Frontend
Open another terminal:
```bash
cd client
npm install
npm run dev
```

Open:
http://localhost:5173

## MongoDB Time-Series
On server startup NexusFlow creates a native MongoDB Time-Series collection named `telemetry` if it does not already exist.

The collection uses:
- timeField: `timestamp`
- metaField: `meta`
- granularity: `seconds`

## Demo
1. Create an account or sign in.
2. The default workflow is already loaded.
3. Click **Start Simulation**.
4. Watch the live telemetry chart and graph status.
5. Use **Graph Builder** to edit the rule.
6. Click **Save & Compile**.
7. Trigger test telemetry from the Dashboard.

## Authentication

The dashboard now requires an account. Register with `POST /api/auth/register`
or use the login screen. Registration requires name, email, and a password of
at least eight characters. Passwords are hashed with bcrypt and sessions use a
server-signed JWT. Telemetry, workflows, alerts, and stats endpoints require
the JWT bearer token. The frontend stores only the session token and public user
profile; provider credentials remain server-side.

Users can later update their Telegram destination with
`PUT /api/auth/notifications` using `{ "telegramChatId": "..." }`. Email
notifications always use the authenticated user's registered `email` field.
After configuring the provider credentials, test both channels with
`POST /api/auth/notifications/test` using the logged-in user's bearer token.

## API
- `GET /api/health`
- `GET /api/telemetry/latest`
- `POST /api/telemetry/ingest`
- `GET /api/workflows`
- `POST /api/workflows`
- `POST /api/workflows/compile`
- `GET /api/alerts`
- `GET /api/stats`
- `GET /api/notifications/status`

## WebSocket
Connect to:
`ws://localhost:5000/ws?token=<JWT>`

Authenticated WebSocket clients can send telemetry:
```json
{
  "type": "telemetry",
  "data": { "deviceId": "turbine-01", "temperature": 84.2, "vibration": 0.42, "pressure": 12.5 }
}
```
The server validates, stores, compiles, and broadcasts the resulting pipeline/alert events.

Telemetry messages:
```json
{
  "type": "telemetry",
  "data": {
    "deviceId": "turbine-01",
    "temperature": 84.2,
    "vibration": 4.8,
    "pressure": 112.4
  }
}
```

Alert messages:
```json
{
  "type": "alert",
  "data": {
    "severity": "critical",
    "message": "Temperature threshold exceeded"
  }
}
```

## Project mapping to the PDF
Week 1:
- Time-Series setup
- Express ingestion endpoints
- React Flow canvas

Week 2:
- RxJS graph compiler
- Data Source / Math / Action node library
- Graph JSON serialization

Week 3:
- Live RxJS rule execution
- Recharts live dashboard
- WebSocket telemetry

Week 4:
- Mock webhook/SMS alerting
- Animated graph activity and premium UI polish

## Performance benchmark

With the backend running, measure the real batch ingestion route with 5,000 telemetry points:

```bash
cd server
npm run benchmark
```

The benchmark creates a synthetic test account and authenticates to the protected
batch endpoint; it never disables production authentication. It reports measured
records-per-second throughput. Override the defaults with
`COUNT`, `CONCURRENCY`, or `API_URL`, for example:

```bash
$env:COUNT=5000; $env:CONCURRENCY=100; npm run benchmark
```

Try reasonable batch/concurrency combinations when measuring the environment;
some historical runs exceeded 5,000 points/sec, but this is not guaranteed:

```bash
$env:COUNT=5000; $env:CONCURRENCY=20; $env:BATCH_SIZE=250; npm run benchmark
```

Workflows are persisted when **Save & Compile** is used. The compiler validates
the graph, rejects cycles and disconnected nodes, and executes supported nodes
in topological order. SMS actions use the built-in mock delivery adapter;
webhook actions POST the alert payload to the configured node URL.

## Real SMS alerts

NexusFlow supports real SMS delivery through Twilio. Create a Twilio account,
purchase or verify a Twilio sender number, and add the three `TWILIO_*` values
to `server/.env`. Never put the auth token in the React app or commit it.

In Graph Builder, set the threshold (for example, `80` °C), add or select the
SMS Alert node, choose **Real SMS**, enter the recipient as an E.164 number such
as `+15551234567`, then click **Save & Compile**. When the moving-average value
crosses the threshold, the backend sends the SMS and records Twilio's delivery
acceptance status. Without valid Twilio settings, the alert is recorded as
`failed` instead of silently pretending that a real message was sent.
Repeated readings are rate-limited by `ALERT_COOLDOWN_MS` (five minutes by
default) so a sustained breach does not generate a paid SMS for every sample.

## Email and Telegram notifications

Critical threshold alerts are persisted first, then the backend attempts both
email and Telegram delivery. A failure in either provider is logged without
failing telemetry ingestion or alert persistence. Missing provider settings are
reported as `skipped`.

Email uses Nodemailer with Gmail SMTP. Enable 2-Step Verification on the Gmail
account, create an App Password under Google Account security, and use that
16-character value as `EMAIL_APP_PASSWORD`; do not use the normal Gmail password.

Create a Telegram bot by messaging `@BotFather` in Telegram, using `/newbot`,
and store the token as `TELEGRAM_BOT_TOKEN`. Each user stores their own Chat ID
in MongoDB. To find a user's Chat ID, send a
message to the bot, then open:
`https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
and copy the `message.chat.id` value. The bot must be able to receive messages
in that chat.

Test the integration by starting the backend and posting telemetry:

```powershell
Invoke-RestMethod -Method Post -Uri http://localhost:5000/api/telemetry/ingest `
  -ContentType 'application/json' `
  -Body '{"deviceId":"turbine-01","temperature":120,"vibration":3,"pressure":112}'
```

The API returns the normal telemetry response. After the alert is persisted,
the WebSocket alert event includes `notifications.email` and
`notifications.telegram`, each with `sent`, `skipped`, or `failed` status.

## Canonical implementation and verification

The submission-ready implementation is the `client/` + `server/` pair. The
older duplicate TypeScript/Socket.IO implementation was removed after audit;
it was not used by the root README, local startup commands, benchmark, or
active API.

Run the active checks:

```bash
cd server
npm test
npm run benchmark

cd ../client
npm run build
```

The benchmark writes measured history to
`server/docs/performance-benchmark.json`. It reports the actual persisted count,
duration, throughput, memory delta, MongoDB collection sizes, time-series
metadata check, and PASS/FAIL result. It never fabricates a target result.

The active backend uses Helmet, CORS, JWT authentication, native `ws`, graceful
SIGINT/SIGTERM shutdown, and MongoDB's native time-series collection. Keep
`server/.env` and any local credentials out of commits; use
`server/.env.example` and `client/.env.example` as templates.

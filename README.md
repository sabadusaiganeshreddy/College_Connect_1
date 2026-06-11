# College Connect

College Connect is a real-time placement collaboration platform for students across colleges.

The project has been upgraded from a Firebase-first MVP into a full-stack architecture with a stateless Node.js API, MongoDB, Redis caching, BullMQ async jobs, and realtime client updates.

## What It Does

- Student registration using college email domains.
- Dynamic college creation when a new domain joins.
- Company visit tracking per college.
- Student selection tracking with profile and LinkedIn views.
- Cross-college search for colleges and companies.
- Cached placement snapshots and leaderboards.
- Async placement-event processing through BullMQ.
- Realtime UI refresh through Server-Sent Events.

## Architecture

- Frontend: React 18, TypeScript, Vite, Tailwind CSS.
- API: Node.js, Express, stateless JWT auth.
- Database: MongoDB via Mongoose.
- Cache and realtime: Redis snapshot cache plus Redis pub/sub.
- Jobs: BullMQ workers backed by Redis.
- Deployment scaffold: Docker Compose with API, worker, MongoDB, and Redis.
- Load test scaffold: k6 placement flow.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full engineering view.

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env:

```bash
copy .env.example .env
```

3. Start MongoDB and Redis:

```bash
docker compose up mongo redis
```

4. Start the API:

```bash
npm run dev:api
```

5. Start the worker:

```bash
npm run dev:worker
```

6. Start the frontend:

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`; API runs on `http://localhost:4000`.

## Docker Stack

Run the backend stack with:

```bash
docker compose up --build api worker mongo redis
```

Then run the frontend locally:

```bash
npm run dev
```

## Load Testing

Install k6, start the backend stack, then run:

```bash
npm run load:test
```

For a deployed target:

```bash
k6 run -e BASE_URL=https://your-api.example.com load-tests/placement-flow.js
```

Use those results before claiming exact concurrency or latency numbers.

## Resume Alignment

Implemented now:

- Stateless Node.js backend.
- MongoDB primary data model.
- Redis cache for hot placement snapshots and leaderboards.
- BullMQ/Redis async event pipeline.
- Realtime update flow decoupled from browser database writes.
- Dockerized API and worker services for horizontal scaling.
- k6 load-test scaffold for concurrency evidence.

Still needs real measurement or cloud deployment before exact claims:

- "1,000+ concurrent students"
- "60% response-time reduction"
- "AWS deployed"
- "zero message loss during peak season"

Those are now realistic to prove, but should be measured and documented.


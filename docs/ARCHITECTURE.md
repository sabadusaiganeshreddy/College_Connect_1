# College Connect Architecture

College Connect is now shaped as a stateless real-time placement platform.

## Runtime Components

- React/Vite client: reads snapshots and sends mutations through HTTP APIs.
- Node.js/Express API: stateless request layer with JWT student identity.
- MongoDB: primary document store for colleges, students, and company visits.
- Redis: cached placement snapshots, leaderboard cache, and realtime pub/sub.
- BullMQ worker: durable async job processing for placement events.
- Server-Sent Events: clients refresh when any API instance publishes a placement update.

## Request Flow

1. A student registers with a college email.
2. The API normalizes the college domain and writes student/college data to MongoDB.
3. The API invalidates Redis cache keys and publishes a placement event.
4. BullMQ stores an async notification job in Redis.
5. API instances receive the Redis pub/sub message and push SSE updates to connected clients.
6. Clients re-fetch the cached placement snapshot through the API.

## Scalability Properties

- API instances do not store sessions in memory.
- JWTs allow API replicas to scale horizontally behind a load balancer.
- Redis holds short-lived hot reads for expensive aggregate snapshots.
- BullMQ decouples write-path event ingestion from notification processing.
- MongoDB remains the source of truth and can be scaled independently.

## Evidence To Collect Before Claiming Production Numbers

- Run `k6 run load-tests/placement-flow.js` against local Docker and deployed AWS targets.
- Capture baseline API latency without Redis by disabling cache reads.
- Capture cached latency with Redis enabled.
- Record p50/p95/p99 latency, error rate, queue depth, and MongoDB CPU.
- Only claim "1,000+ concurrent students" or "60% response-time reduction" after saving these results.

## AWS Deployment Shape

Recommended production mapping:

- Application Load Balancer -> multiple ECS/Fargate API tasks.
- Separate ECS/Fargate worker service for BullMQ jobs.
- MongoDB Atlas or Amazon DocumentDB-compatible deployment for primary data.
- Amazon ElastiCache Redis for cache, pub/sub, and BullMQ storage.
- CloudWatch dashboards for API latency, worker failures, queue depth, and container restarts.


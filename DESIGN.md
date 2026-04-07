# Trust Signals Pipeline — Design Document

## 1. Architecture Overview

The system follows a layered architecture to ensure separation of concerns and maintainability:

**Layers:**
- **Routes**: Fastify plugins defining endpoints, request validation (JSON Schema), and middleware orchestration.
- **Services**: Business logic for event aggregation, risk scoring, and OTP management.
- **Store**: A singleton in-memory storage using native `Map` objects.

**Request Flow Diagram:**
```text
[Client] 
   |
   V
[Rate Limiter Middleware] (Fixed window, in-memory)
   |
   V
[Auth Middleware] (API Key check)
   |
   V
[Fastify Route] (JSON Schema Validation)
   |
   V
[Business Service] (Aggregator / Scorer / OTP)
   |
   V
[In-Memory Store] (Map<string, T>)
```

**Tradeoffs:**
- **In-Memory Map vs Redis**: Chosen for simplicity and low latency in a single-instance setup. However, it lacks persistence and horizontal scalability.
- **Fastify**: Chosen for its high performance, excellent TypeScript support, and built-in schema validation using Ajv.

## 2. Risk Scoring Formula

The risk score is calculated using three primary factors with specific weights:

- **Fingerprint Factor (40%)**: `clamp((distinct_fingerprints - 1) / 4, 0, 1) × 0.40`
  - *Rationale*: Device fingerprints are harder to spoof than IPs. High variety indicates a shared or stolen account.
- **IP Factor (35%)**: `clamp((distinct_ip_prefixes - 1) / 4, 0, 1) × 0.35`
  - *Rationale*: Multiple network origins suggest account sharing or VPN abuse. Uses /24 prefix to handle dynamic IP rotations.
- **Velocity Factor (25%)**: `clamp((sessions_per_hour - 1) / 9, 0, 1) × 0.25`
  - *Rationale*: Detects automated scripts or extreme account sharing over time.

**Recommendation Thresholds:**
- `< 0.35`: **Allow** (Low risk)
- `0.35 - 0.65`: **Challenge** (Moderate risk, OTP required)
- `> 0.65`: **Block** (High risk, immediate rejection)

## 3. Security Considerations

- **OTP Lifecycle**: Use `node:crypto` for CSPRNG codes. 5-minute expiry, 3-attempt limit, and automatic invalidation on exhaustion or expiry.
- **API Security**: Token-based authentication via `x-api-key`. Rate limiting at the middleware layer prevents brute-force and DoS.
- **Rate Limiting**: Implements a fixed-window algorithm with an automated cleanup cycle (`setInterval`) to prevent memory leaks from stale entries.

## 4. Tradeoffs and Future Improvements

- **Scalability**: Move from `Map` to **Redis Cluster** for multi-node deployments.
- **Persistence**: Integrate a persistent database (PostgreSQL/MongoDB) for event history.
- **Rate Limiting**: Upgrade to a sliding window algorithm (using Redis sorted sets) for smoother limiting.
- **Async Processing**: Use a message queue (Kafka/RabbitMQ) for event ingestion to decouple ingest latency from aggregation.

## 5. Failure Modes

- **State Loss**: Server restarts wipe all signals and challenges. (Acceptable for this scope).
- **Clock Sensitivity**: OTP expiry depends on server time. Ensured consistency by using server-side timestamps only.
- **Memory Growth**: Mitigated by periodic store cleanup, but extreme traffic could lead to OOM without external storage.

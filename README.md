# Trust Signals Pipeline API

A high-performance security infrastructure designed to detect and mitigate account sharing, bot activity, and systemic abuse. Built with Node.js and Fastify, it provides transparent, explainable risk scoring and cryptographically secure challenge flows.

## 🚀 Key Features

- **Blazing Fast**: Powered by Fastify and optimized in-memory storage for low-latency lookups (< 1ms).
- **Intelligent Risk Scoring**: Uses a weighted heuristic model based on fingerprint variety, IP prefix locality, and session velocity.
- **Secure OTP Lifecycle**: Generates 6-digit codes via CSPRNG with 5-minute hard expiry and 3-attempt lockout.
- **API Protection**: Built-in rate limiting and constant-time API key verification.
- **OpenAPI Ready**: Deterministic endpoints for easy integration.

---

## 🛠️ Tech Stack

- **Runtime**: Node.js (v20+)
- **Framework**: Fastify (TypeScript)
- **Validation**: Ajv (JSON Schema)
- **Testing**: Vitest
- **Development**: tsx (TypeScript eXecution)

---

## ⚙️ Installation & Setup

### 1. Prerequisites
Ensure you have **Node.js (LTS)** and **npm** installed.

### 2. Clone and Install
```bash
git clone <repository-url>
cd trust-signals-pipeline
npm install
```

### 3. Configuration
Copy the example environment file and set your desired API key:
```bash
cp .env.example .env
```
*Note: Ensure `INGEST_API_KEY` in `.env` matches the key you'll use in your requests.*

---

## 🚦 Running the Application

### Development Mode (Watch)
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

---

## 🧪 Testing & Verification

### Automated Suites
The project includes comprehensive unit and integration tests.
```bash
# Run all tests
npm test

# Run with coverage reports
npm run test:coverage
```

### End-to-End Simulation
Use the provided fixtures script to ingest sample data and see the risk scoring in action:
```bash
# Ensure script is executable
chmod +x scripts/run-fixtures.sh

# Run the simulation
bash scripts/run-fixtures.sh
```

---

## 📖 API Documentation (Overview)

### 1. Event Ingestion
**POST** `/v1/events`  
Ingest a batch of user session events (login, page_view, etc.).

### 2. Risk Evaluation
**GET** `/v1/accounts/:account_id/risk`  
Retrieve the current risk score and recommendation (`ALLOW`, `CHALLENGE`, or `BLOCK`).

### 3. Challenge Flow
- **POST** `/v1/challenge`: Start a new identity verification.
- **POST** `/v1/challenge/verify`: Validate a 6-digit OTP.

---

## 🔒 Security Recommendations
- **API Key**: Always include `X-API-Key` in the request header.
- **Rate Limits**: Default limits apply to challenge endpoints to prevent brute-force attacks.
- **Account Sharing**: Scores above **0.65** indicate high-confidence abuse and should be blocked.

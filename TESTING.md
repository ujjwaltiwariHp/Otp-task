# Trust Signals Pipeline — Testing Documentation

This guide covers how to verify the API using automated tests, manual terminal commands, and pre-defined fixture scripts.

## 1. Prerequisites
Ensure the server is running or you have the necessary tools installed (`jq`, `curl`).

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

---

## 2. Automated Testing (Vitest)
The project includes a suite of integration and unit tests that cover ingestion, risk scoring, and OTP logic.

```bash
# Run all tests
npm test

# Run tests with coverage reports
npm run test:coverage
```

---

## 3. Fixtures Script
The easiest way to verify end-to-end functionality with the provided data files is the `run-fixtures.sh` script. It automatically starts the server, ingests data, and prints risk scores.

```bash
# Ensure script is executable
chmod +x scripts/run-fixtures.sh

# Run the full end-to-end simulation
bash scripts/run-fixtures.sh
```

---

## 4. Manual Testing (cURL)
Use these commands to test specific endpoints manually while the server is running.

### Health Check (No Auth)
```bash
curl -i http://localhost:8080/health
```

### Ingest Batch Events
Replace `<API_KEY>` with your key from `.env`.
```bash
curl -X POST http://localhost:8080/v1/events \
  -H "X-API-Key: sk_test_assignment_only_not_real" \
  -H "Content-Type: application/json" \
  -d '{
    "events": [{
      "event_id": "test_cmd_001",
      "account_id": "user_terminal",
      "session_id": "sess_001",
      "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'",
      "client": { "surface": "cli" },
      "device": { "fingerprint": "f_cli_1" },
      "network": { "ip": "127.0.0.1" }
    }]
  }'
```

### Risk Computation
```bash
curl -s http://localhost:8080/v1/accounts/user_terminal/risk \
  -H "X-API-Key: sk_test_assignment_only_not_real" | jq .
```

### OTP Lifecycle Verification
```bash
# 1. Create a dynamic challenge
CHALLENGE_RES=$(curl -s -X POST http://localhost:8080/v1/challenge \
  -H "X-API-Key: sk_test_assignment_only_not_real" \
  -H "Content-Type: application/json" \
  -d '{"account_id": "user_terminal", "session_id": "sess_001"}')

echo $CHALLENGE_RES | jq .

# 2. Extract ID and Code
ID=$(echo $CHALLENGE_RES | jq -r .challenge_id)
CODE=$(echo $CHALLENGE_RES | jq -r .code)

# 3. Verify the challenge
curl -s -X POST http://localhost:8080/v1/challenge/verify \
  -H "X-API-Key: sk_test_assignment_only_not_real" \
  -H "Content-Type: application/json" \
  -d "{\"challenge_id\": \"$ID\", \"code\": \"$CODE\"}" | jq .
```

---

## 5. Testing Error Scenarios
- **401 Unauthorized**: Omit the `X-API-Key` header (`curl -X GET http://localhost:8080/v1/accounts/any/risk`).
- **429 Rate Limit**: Fire 20+ OTP requests to `/v1/challenge` in rapid succession.
- **400 Invalid Request**: Send an empty JSON body or missing required fields.
- **400 OTP Exhausted**: Attempt validation with the wrong code three times.

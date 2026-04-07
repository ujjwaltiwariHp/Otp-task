#!/usr/bin/env bash

# Start the server in background
npx tsx src/server.ts &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
sleep 5

BASE="http://localhost:8080"
KEY=${INGEST_API_KEY:-sk_test_assignment_only_not_real}

# Process fixture files
FILES=("data/events-normal.jsonl" "data/events-sharing.jsonl" "data/events-ambiguous.jsonl" "data/events-chaos.jsonl")

for FILE in "${FILES[@]}"; do
  echo "--- Processing $FILE ---"
  
  # Build JSON payload: { "events": [ ...parsed lines ] }
  # Read each line, convert to JSON object, and combine into a comma-separated list
  EVENTS_JSON=$(cat "$FILE" | jq -s -c '{events: .}')
  
  curl -s -X POST "$BASE/v1/events" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $KEY" \
    -d "$EVENTS_JSON" | jq .
done

# Accounts to check
ACCOUNTS=("user_alice" "user_bob" "user_shared" "user_traveler" "user_vpn" "user_family" "user_chaos")

echo "--- Account Signals & Risk ---"
for ID in "${ACCOUNTS[@]}"; do
  echo "Account: $ID"
  echo "Signals:"
  curl -s -X GET "$BASE/v1/accounts/$ID/signals" -H "X-API-Key: $KEY" | jq .
  echo "Risk:"
  curl -s -X GET "$BASE/v1/accounts/$ID/risk" -H "X-API-Key: $KEY" | jq .
  echo "--------------------------"
done

# Cleanup
echo "Stopping server (PID: $SERVER_PID)..."
kill $SERVER_PID

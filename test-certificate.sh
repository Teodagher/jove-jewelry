#!/bin/bash

# Setup: replace with actual admin token and order ID
ADMIN_TOKEN="your-admin-token"
ORDER_ID="your-order-id"

# Test certificate download route
echo "Testing Certificate Download Route:"
curl -v -X POST http://localhost:3000/api/admin/certificate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"orderId\": \"$ORDER_ID\", \"lineItemIndex\": 0}"

echo "\n\nTesting Certificate Email Route:"
curl -v -X POST http://localhost:3000/api/admin/certificate/send \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"orderId\": \"$ORDER_ID\", \"lineItemIndex\": 0}"
#!/bin/bash
echo "Starting Smoke Test (E2E API-backed UI flows)..."
echo "Ensure your backend is running at http://localhost:3000"

# Install playwright browsers if needed (mostly cached)
npx playwright install --with-deps chromium

# Run E2E tests
npm run e2e

if [ $? -eq 0 ]; then
  echo "Smoke Test Passed!"
  exit 0
else
  echo "Smoke Test Failed."
  exit 1
fi

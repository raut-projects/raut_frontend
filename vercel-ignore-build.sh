#!/bin/bash

# This script tells Vercel whether to build or skip the deployment
# Exit 0 = Skip build (no deployment)
# Exit 1 = Proceed with build (deploy)

echo "Branch: $VERCEL_GIT_COMMIT_REF"

# Only deploy if branch is 'staging'
if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ]; then
  echo "✅ Deploying staging branch"
  exit 1  # Proceed with build
else
  echo "⏭️  Skipping deployment for branch: $VERCEL_GIT_COMMIT_REF"
  exit 0  # Skip build
fi

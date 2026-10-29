#!/bin/bash

# This script tells Vercel whether to build or skip the deployment
# Exit 0 = Skip build (no deployment)
# Exit 1 = Proceed with build (deploy)

echo "=========================================="
echo "Branch: $VERCEL_GIT_COMMIT_REF"
echo "Commit: $VERCEL_GIT_COMMIT_SHA"
echo "Environment: $VERCEL_ENV"
echo "=========================================="

# Only deploy staging branch
# Skip all PRs, feature branches, and main branch
if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ] && [ "$VERCEL_ENV" = "preview" ]; then
  echo "✅ DEPLOYING: Staging branch detected"
  exit 1  # Proceed with build
fi

# Skip everything else
echo "⏭️  SKIPPED: Only staging branch is deployed to Vercel"
echo "   - Main branch: Deploys to VPS via GitHub Actions"
echo "   - Feature branches: Not deployed"
echo "   - Pull requests: Not deployed"
exit 0  # Skip build

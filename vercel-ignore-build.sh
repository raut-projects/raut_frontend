#!/bin/bash

# Exit 1 = Build, Exit 0 = Skip build

if [ "$VERCEL_GIT_COMMIT_REF" = "staging" ]; then
  echo "✅ Building staging branch"
  exit 1
else
  echo "⏭️  Skipping non-staging branch: $VERCEL_GIT_COMMIT_REF"
  exit 0
fi

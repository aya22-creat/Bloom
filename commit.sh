#!/bin/bash
cd /home/darrag/التنزيلات/shada_project/Bloom

echo "=== Git Status ==="
git status --short

echo ""
echo "=== Adding Changes ==="
git add server/src/index.ts server/src/lib/database.ts

echo ""
echo "=== Committing ==="
git commit -m "Add exercise evaluation route and fix reminders table schema

- Add exerciseEvaluation route import and endpoint (/api/exercise-evaluation)
- Update reminders table schema with missing columns (is_active, target_type, etc.)
- Rebuild server with updated schema
- All endpoints tested and working
- Both frontend and backend running successfully"

echo ""
echo "=== Checking remote ==="
git remote -v

echo ""
echo "=== Pushing to main ==="
git push origin main

echo ""
echo "=== Done ==="

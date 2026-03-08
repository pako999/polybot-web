#!/bin/bash
# ============================================
# SETUP: Push website to GitHub → deploys on Vercel
# ============================================
# Usage:
#   chmod +x setup-web.sh
#   ./setup-web.sh YOUR_GITHUB_USERNAME
# ============================================

USERNAME=${1:-"pako999"}
REPO="polybot-web"

echo "=== PolyBot Web — Git Setup ==="
echo "Repo: https://github.com/$USERNAME/$REPO"
echo ""

# Make sure we're in the right directory
if [ ! -f "package.json" ]; then
  echo "ERROR: Run this from the polybot-web directory"
  exit 1
fi

# Init git
git init
git branch -M main

# Add all files
git add .
git commit -m "PolyBot SaaS: Next.js + Clerk auth + live dashboard"

# Push
git remote add origin "https://github.com/$USERNAME/$REPO.git"
git push -u origin main

echo ""
echo "=== DONE! ==="
echo ""
echo "Next steps:"
echo "  1. Go to https://vercel.com/new"
echo "  2. Import $REPO"
echo "  3. Add environment variables:"
echo "     NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = pk_live_xxx"
echo "     CLERK_SECRET_KEY = sk_live_xxx"
echo "     NEXT_PUBLIC_BOT_API_URL = http://YOUR_VPS_IP:8899"
echo "  4. Deploy!"

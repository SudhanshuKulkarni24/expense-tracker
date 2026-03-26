#!/bin/bash
# Build script for Vercel

# Build Expo web app
npx expo export --platform web

# Copy landing page and policy files
cp public/landing.html dist/landing.html
cp public/privacy-policy.html dist/privacy-policy.html
cp public/terms-of-service.html dist/terms-of-service.html

# Rename Expo index to app.html and use landing as index
mv dist/index.html dist/app.html
cp public/landing.html dist/index.html

echo "Build complete!"

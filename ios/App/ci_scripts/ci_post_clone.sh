#!/bin/sh
set -e
echo "Running ci_post_clone..."
cd "$CI_WORKSPACE"
npm install
npx cap sync ios
echo "ci_post_clone done."

#!/bin/sh
set -e

echo "Installing Homebrew..."
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" < /dev/null

echo "Installing Node.js..."
/opt/homebrew/bin/brew install node

echo "Running npm install..."
cd "$CI_WORKSPACE"
/opt/homebrew/bin/npm install

echo "Syncing Capacitor..."
/opt/homebrew/bin/npx cap sync ios

echo "Done."

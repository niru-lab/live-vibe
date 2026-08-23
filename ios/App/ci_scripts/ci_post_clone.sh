#!/bin/sh
set -e

echo "Finding Node..."
which node || true
ls /usr/local/bin/node || true
ls /usr/bin/node || true
ls ~/.nvm/versions/ || true

echo "PATH: $PATH"

echo "Done."

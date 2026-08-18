#!/usr/bin/env bash
set -euo pipefail

# Compatibility wrapper. The canonical, secret-safe validator is npm run env:check.
npm run env:check -- production "$@"

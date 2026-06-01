#!/usr/bin/env bash
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Check Docker is installed and running
if ! command -v docker &>/dev/null; then
  echo "Docker is not installed. Get it from https://docs.docker.com/get-docker/"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo "Docker is not running. Start Docker and try again."
  exit 1
fi

# Bake the repo path into the CLI and install it
sed "s|BOOKMARK_REPO_ROOT_PLACEHOLDER|$REPO_ROOT|g" \
  "$REPO_ROOT/bookmark-cli" > /tmp/bookmark-cli-built

sudo cp /tmp/bookmark-cli-built /usr/local/bin/bookmark
sudo chmod +x /usr/local/bin/bookmark
rm /tmp/bookmark-cli-built

echo "Done. Run: bookmark start"
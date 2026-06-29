#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[bookmark]${RESET} $*"; }
success() { echo -e "${GREEN}[✓]${RESET} $*"; }
error()   { echo -e "${RED}[✗]${RESET} $*" >&2; exit 1; }

echo -e "${BOLD}"
cat << 'EOF'
  ██████╗  ██████╗  ██████╗ ██╗  ██╗███╗   ███╗ █████╗ ██████╗ ██╗  ██╗
  ██╔══██╗██╔═══██╗██╔═══██╗██║ ██╔╝████╗ ████║██╔══██╗██╔══██╗██║ ██╔╝
  ██████╔╝██║   ██║██║   ██║█████╔╝ ██╔████╔██║███████║██████╔╝█████╔╝
  ██╔══██╗██║   ██║██║   ██║██╔═██╗ ██║╚██╔╝██║██╔══██║██╔══██╗██╔═██╗
  ██████╔╝╚██████╔╝╚██████╔╝██║  ██╗██║ ╚═╝ ██║██║  ██║██║  ██║██║  ██╗
  ╚═════╝  ╚═════╝  ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝
EOF
echo -e "${RESET}"

# ── Step 1: Check Docker ───────────────────────────────────────────────────────
info "Checking Docker..."

if ! command -v docker &>/dev/null; then
  error "Docker is not installed.
  Get it from: https://docs.docker.com/get-docker/
  Then re-run: bash install.sh"
fi

if ! docker info &>/dev/null 2>&1; then
  error "Docker is installed but not running.
  Start it with: sudo systemctl start docker
  Then re-run: bash install.sh"
fi

success "Docker is ready"

# ── Step 2: Install bookmark CLI ──────────────────────────────────────────────
info "Installing bookmark CLI..."

if [[ ! -f "$REPO_ROOT/bookmark-cli" ]]; then
  error "bookmark-cli not found in $REPO_ROOT — is the repo complete?"
fi

# Replace the placeholder with the actual repo path
# This is how the CLI knows where docker-compose.yml lives
# after it gets moved to /usr/local/bin/
sed "s|BOOKMARK_REPO_ROOT_PLACEHOLDER|${REPO_ROOT}|g" \
  "$REPO_ROOT/bookmark-cli" > /tmp/bookmark-built

sudo mkdir -p /usr/local/bin
sudo cp /tmp/bookmark-built /usr/local/bin/bookmark
sudo chmod +x /usr/local/bin/bookmark
rm /tmp/bookmark-built

success "bookmark CLI installed → /usr/local/bin/bookmark"

# ── Step 3: Build and start containers ────────────────────────────────────────
info "Building and starting Bookmark (first run pulls Docker images, may take a few minutes)..."

cd "$REPO_ROOT"

# Auto-detect NVIDIA GPU; fall back to CPU if unavailable
COMPOSE_FILES="-f docker-compose.yml"
if command -v nvidia-smi &>/dev/null && nvidia-smi &>/dev/null 2>&1; then
  info "NVIDIA GPU detected — enabling GPU acceleration"
  COMPOSE_FILES="-f docker-compose.yml -f docker-compose.gpu.yml"
else
  info "No NVIDIA GPU detected — running on CPU"
fi

docker compose $COMPOSE_FILES up -d --build

# ── Step 4: Wait for frontend to be ready ─────────────────────────────────────
info "Waiting for services to be ready..."

SPINNER='⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'
i=0
until docker inspect --format='{{.State.Running}}' bookmark-frontend 2>/dev/null | grep -q true; do
  printf "\r${CYAN}[bookmark]${RESET} Starting up... ${SPINNER:$((i % ${#SPINNER})):1}"
  i=$((i + 1))
  sleep 0.2
done

# Wait for the frontend port to actually accept connections
until curl -s -o /dev/null http://localhost:8081; do
  printf "\r${CYAN}[bookmark]${RESET} Almost ready... ${SPINNER:$((i % ${#SPINNER})):1}"
  i=$((i + 1))
  sleep 0.5
done
printf "\r\033[K"

# ── Step 5: Open browser ───────────────────────────────────────────────────────
if command -v xdg-open &>/dev/null; then
  xdg-open http://localhost:8081 &>/dev/null &
elif command -v open &>/dev/null; then
  open http://localhost:8081
fi

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  ✓ Bookmark is running!${RESET}"
echo ""
echo -e "  ${BOLD}App:${RESET}  http://localhost:8081"
echo ""
echo -e "  Complete the setup wizard in your browser to download AI models."
echo ""
echo -e "  ${BOLD}Load the Chrome extension:${RESET}"
echo -e "  1. Open chrome://extensions"
echo -e "  2. Enable Developer mode (top-right toggle)"
echo -e "  3. Click 'Load unpacked' → select ${BOLD}extension/dist/${RESET}"
echo ""
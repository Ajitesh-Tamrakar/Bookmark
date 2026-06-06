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

sudo cp /tmp/bookmark-built /usr/local/bin/bookmark
sudo chmod +x /usr/local/bin/bookmark
rm /tmp/bookmark-built

success "bookmark CLI installed → /usr/local/bin/bookmark"

# ── Step 3: Start everything ───────────────────────────────────────────────────
info "Starting Bookmark (this pulls Docker images on first run, may take a few minutes)..."

cd "$REPO_ROOT"
docker compose up --build #for development, should be replaced with -d when not debugging

# ── Done ───────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}  ✓ Bookmark is running!${RESET}"
echo ""
echo -e "  ${BOLD}App:${RESET}         http://localhost:8081"
echo -e "  ${BOLD}Django API:${RESET}  http://localhost:8080"
echo ""
echo -e "  ${YELLOW}Note:${RESET} Ollama is downloading AI models in the background."
echo -e "  Search won't work until both models are ready. Watch progress:"
echo -e "  ${CYAN}bookmark logs ollama${RESET}"
echo ""
echo -e "  ${BOLD}Load the Chrome extension:${RESET}"
echo -e "  1. Open chrome://extensions"
echo -e "  2. Enable Developer mode (top-right toggle)"
echo -e "  3. Click 'Load unpacked' → select ${BOLD}extension/dist/${RESET}"
echo ""
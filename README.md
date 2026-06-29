# Bookmark 🔖

A self-hosted, open source browser extension that captures content from the
web and lets you search across all of it using natural language — powered
entirely by a local AI model running on your own machine.

No cloud. No subscriptions. No data leaving your device.

> **Prototype notice:** Currently only YouTube is supported. LinkedIn,
> Pinterest, Twitter/X, and general web capture are planned.

---

## How it works

1. Click the Bookmark button on any YouTube video
2. Bookmark extracts the transcript and runs it through a local AI model
3. Weeks later, search in plain language — *"that video about negotiation"*
   — and it finds it, even if you remember nothing else about it

Everything runs on your machine. Nothing is sent anywhere.

---

## Requirements

- [Docker Desktop](https://docs.docker.com/get-docker/) — the only thing you need to install manually
- 8 GB RAM minimum, 16 GB recommended
- Google Chrome

Python, Node.js, PostgreSQL, pgvector, and Ollama are all handled inside Docker automatically.

---

## Installation

### Linux

```bash
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
bash install.sh
```

This installs the `bookmark` CLI and starts all services. Then:

```bash
bookmark start
```

---

### macOS

```bash
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
bash install.sh
```

Same as Linux — the script handles macOS differences automatically. Then:

```bash
bookmark start
```

> Make sure Docker Desktop is running before you run the script.

---

### Windows

`bash` scripts don't run natively on Windows, so skip `install.sh` and use Docker directly.

1. Install [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/) and make sure it's running
2. Open **PowerShell** or **Command Prompt** in the project folder
3. Run:

```powershell
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
docker compose up -d --build
```

4. Open **http://localhost:8081** in Chrome once it's ready (takes a minute or two on first run)

> On first run, Docker pulls all the required images. This may take several minutes depending on your connection.

---

## Loading the Chrome Extension

After the app is running, load the browser extension:

1. Open **chrome://extensions** in Chrome
2. Enable **Developer mode** using the toggle in the top-right corner
3. Click **Load unpacked**
4. Navigate to the repo folder and select the **`extension/dist/`** folder
5. The Bookmark icon will appear in your Chrome toolbar

---

## Usage

### Linux / macOS — `bookmark` CLI

```bash
bookmark start        # start all services
bookmark stop         # stop all services
bookmark restart      # restart all services
bookmark status       # show running containers
```

**Logs:**
```bash
bookmark logs                 # tail all services
bookmark logs ollama          # watch model download progress (first run)
bookmark logs backend         # tail Django API
bookmark logs frontend        # tail React app
bookmark logs 200             # tail last 200 lines across all services
```

**Maintenance:**
```bash
bookmark update       # git pull → rebuild containers → restart
bookmark uninstall    # full removal — containers, volumes, and all saved data
```

---

### Windows — Docker Compose

```powershell
docker compose up -d --build    # start (and build on first run)
docker compose up -d            # start (after first run)
docker compose down             # stop
docker compose restart          # restart
docker compose ps               # show running containers
```

**Logs:**
```powershell
docker compose logs -f                    # tail all services
docker compose logs ollama -f             # watch model download (first run)
docker compose logs backend -f            # tail Django API
docker compose logs frontend -f           # tail React app
docker compose logs --tail=200 -f         # tail last 200 lines
```

**Maintenance:**
```powershell
docker compose up -d --build              # rebuild after a git pull
docker compose down -v --remove-orphans   # full uninstall (deletes all data)
```

---

## Troubleshooting

**Models taking too long or search not working**

`nomic-embed-text-v2-moe` and `gemma4:e2b` download in the background on
first run. Search will not work until both are fully downloaded. Check progress:

```bash
# Linux / macOS
bookmark logs ollama

# Windows
docker compose logs ollama -f
```

**Port 8080 or 8081 already in use**

Something else is using that port. Find and stop it:

```bash
# Linux / macOS
sudo lsof -i :8080
sudo lsof -i :8081

# Windows (PowerShell)
netstat -ano | findstr :8080
netstat -ano | findstr :8081
```

Then start Bookmark again.

**Docker is not running**

```bash
# Linux
sudo systemctl start docker

# macOS / Windows
# Open Docker Desktop from your applications
```

**Permission denied on `docker compose` (Linux)**

Your user is not in the docker group. Run:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Then try again.

**Permission denied running install.sh (Linux / macOS)**

Use `bash install.sh` instead of `./install.sh`.

---

## Data & Privacy

Everything runs locally. Your saved content, search queries, and embeddings
never leave your machine. The only outbound requests are to fetch content
from the platform you are saving from — the same request your browser makes
anyway.

Export your full library at any time from app settings as a single SQLite file.

---

## Roadmap

- [ ] LinkedIn support
- [ ] Pinterest support
- [ ] Twitter/X support
- [ ] General web page capture
- [ ] Mobile companion app
- [ ] Multi-device sync (end-to-end encrypted, opt-in)

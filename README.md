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

- [Docker](https://docs.docker.com/get-docker/) — the only thing you need to install manually
- 8 GB RAM minimum, 16 GB recommended
- Google Chrome

Python, Node.js, PostgreSQL, pgvector, and Ollama are all handled inside Docker automatically.

---

## Installation

```bash
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
bash install.sh
```

The installer registers the `bookmark` CLI command on your system.
That's all it does — Docker handles everything else.

Then start Bookmark:

```bash
bookmark start
```

On first run, Ollama downloads the required AI models in the background.
This takes a few minutes depending on your connection. Watch progress:

```bash
bookmark logs ollama
```

Once running, open **http://localhost:8081** in Chrome.

**Load the browser extension:**
1. Open `chrome://extensions`
2. Enable Developer mode (toggle, top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist/` folder inside the repo

---

## Usage

**Service control:**
```bash
bookmark start       # start all services
bookmark stop        # stop all services
bookmark restart     # restart all services
bookmark status      # show running containers
```

**Logs:**
```bash
bookmark logs                # tail all services
bookmark logs ollama         # tail Ollama — useful on first run to watch model download
bookmark logs backend        # tail Django API
bookmark logs frontend       # tail React app
bookmark logs 200            # tail last 200 lines across all services
```

**Maintenance:**
```bash
bookmark update      # git pull → rebuild containers → restart
bookmark uninstall   # full removal — containers, volumes, and all saved data
```

---

## Troubleshooting

**Permission denied on `docker compose`**

Your user is not in the docker group. Run:
```bash
sudo usermod -aG docker $USER
newgrp docker
```
Then try `bookmark start` again.

**Models taking too long or search not working**

`nomic-embed-text-v2-moe` and `gemma4:e2b` download in the background on
first run. Search will not work until both are fully downloaded. Check:
```bash
bookmark logs ollama
```

**Port 8080 or 8081 already in use**

Something else is using that port. Find and stop it:
```bash
sudo lsof -i :8080
sudo lsof -i :8081
```
Then run `bookmark start` again.

**Permission denied running install.sh**

Use `bash install.sh` instead of `./install.sh`.

**Docker is not running**

Start Docker and try again:
```bash
# Linux
sudo systemctl start docker

# macOS / Windows
# Open Docker Desktop from your applications
```

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

---
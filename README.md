# Bookmark 🔖

A self-hosted, open source browser extension that captures content from the web and lets you search across all of it using natural language — powered entirely by a local AI model running on your own machine.

No cloud. No subscriptions. No data leaving your device.

> **Prototype notice:** Currently only YouTube is supported. LinkedIn, Pinterest, Twitter/X, and general web capture are planned.

---

## How it works

1. Click the Bookmark button on any YouTube video
2. Bookmark extracts the transcript and runs it through a local AI model
3. Weeks later, search in plain language — *"that video about negotiation"* — and it finds it, even if you remember nothing else about it

Everything runs on your machine. Nothing is sent anywhere.

---

## Requirements

- macOS, Linux, or Windows (WSL2)
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+ with [pgvector](https://github.com/pgvector/pgvector#installation)
- 8 GB RAM minimum, 16 GB recommended
- Ollama — installed automatically if not present

---

## Installation

```bash
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
bash install.sh
```

The installer will:
- Install all Python and Node dependencies (isolated, never touches system Python)
- Set up the PostgreSQL database
- Download the required Ollama models
- Register Bookmark as a background service (auto-starts on reboot)
- Register the `bookmark` CLI command

After install, open **http://localhost:8081** in Chrome to complete setup.

**Load the browser extension:**
1. Open `chrome://extensions`
2. Enable Developer mode (top-right toggle)
3. Click Load unpacked
4. Select the `extension/dist/` folder inside the repo

---

## Usage

After install, Bookmark runs automatically in the background on every boot.
Open **http://localhost:8081** to use the app.

**Service control:**
```bash
bookmark start       # start Bookmark + Ollama
bookmark stop        # stop both
bookmark restart     # stop and restart both
bookmark status      # live health check — server / Ollama / Postgres
```

**Logs:**
```bash
bookmark logs        # last 50 lines
bookmark logs 200    # last n lines
```

**Maintenance:**
```bash
bookmark update      # git pull → install → migrate → rebuild → restart
bookmark uninstall   # full clean removal, keeps your data
```

---

## Troubleshooting

**`bookmark status` shows Postgres unreachable**
PostgreSQL is not running. Start it with `sudo systemctl start postgresql` (Linux) or `brew services start postgresql` (macOS).

**pgvector extension missing**
Install pgvector for your PostgreSQL version: https://github.com/pgvector/pgvector#installation

**Permission denied running install.sh**
Use `bash install.sh` instead of `./install.sh`.

**Ollama port 11434 already in use**
Another Ollama instance is running. Stop it with `pkill ollama` and re-run `bookmark start`.

---

## Data & Privacy

Everything runs locally. Your saved content, search queries, and embeddings never leave your machine. The only outbound requests are to fetch content from the platform you are saving from — the same request your browser makes anyway.

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

## License

MIT — see [LICENSE](LICENSE)
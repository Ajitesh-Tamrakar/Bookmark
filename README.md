# Internet Expedition 🔖

Save anything you find online (videos, posts, articles, pins) and find it
again later just by describing what you remember about it.

No account. No subscription. Nothing you save ever leaves your computer.

![Screenshot: app icon or hero banner showing the app in use](placeholder-hero.png)

---

## Which computer are you using?

- [Windows](#windows-setup)
- [Mac](#mac-setup)
- [Linux](#linux-setup)

Then continue to [Load the browser extension](#load-the-browser-extension). That part is the same for everyone.

---

## Windows Setup

### Step 1: Install Docker Desktop

Docker Desktop is a free program that lets Internet Expedition run safely on your computer.

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Download **Docker Desktop for Windows**
3. Open the downloaded file and follow the on-screen installer
4. Once installed, open Docker Desktop from your Start menu and leave it running

![Screenshot: Docker Desktop download page](assets/docker_download_page.png)

**Make sure it's actually running before moving on:**

Open the Docker Desktop app and look at the bottom-left corner. It should say
**"Engine running"** with a green dot. If it says "Starting..." or is red, wait
a minute and check again.

![Screenshot: Docker Desktop showing Engine running status](placeholder-docker-engine-running.png)

> 💡 If Docker Desktop asks you to enable **WSL2** during install, click yes.
> This is normal and required.

### Step 2: Download Internet Expedition

1. Go to the project page: `[link to your project page]`
2. Click the green **Code** button, then click **Download ZIP**
3. Open your Downloads folder, right-click the ZIP file, and choose **Extract All**
4. Move the extracted **Internet Expedition** folder somewhere easy to find, like your Desktop

![Screenshot: Download ZIP button on the project page](assets/github_project_page.png)

### Step 3: Open a command window inside that folder

1. Open **File Explorer** and go inside the **Internet Expedition** folder
   (you should see files like `docker-compose.yml` inside it)
2. Click once in the empty address bar at the top of the window
3. Type `cmd` and press **Enter**

![Screenshot: typing cmd into File Explorer's address bar](placeholder-cmd-trick.png)

A black window (Command Prompt) opens, already pointed at the right folder.

> 💡 If Windows shows a blue "Windows protected your PC" warning at any point,
> click **More info**, then **Run anyway**. This just means the file isn't
> digitally signed yet, not that something is wrong.

### Step 4: Start it up

In the black window, type this exactly and press **Enter**:

```
docker compose up -d --build
```

![Screenshot: the command being pasted into Command Prompt](placeholder-paste-command.png)

The first time you do this, it will take several minutes while it downloads
and builds everything it needs. You'll see a lot of text scroll by. That's
normal.

### Step 5: How do you know it worked?

The command window will finish and give you back a blinking cursor. That
just means the *instruction* was sent, not that the app is fully ready yet.

The reliable way to check:

1. Switch to the **Docker Desktop** app
2. Click **Containers** in the left sidebar
3. You should see a group of containers, all with a green dot next to them

![Screenshot: Docker Desktop Containers tab showing all services running](placeholder-containers-running.png)

Once everything is green, open Chrome and go to:

**http://localhost:8081**

> 💡 The very first time, it may take an extra minute or two while it finishes
> downloading the AI model in the background. If the page looks empty, wait
> a bit and refresh.

Continue to [Load the browser extension](#load-the-browser-extension) below.

---

## Mac Setup

### Step 1: Install Docker Desktop

1. Go to [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop/)
2. Download **Docker Desktop for Mac** (choose Apple Silicon or Intel; if unsure, click the Apple menu → About This Mac to check your chip)
3. Open the downloaded file and drag Docker into Applications
4. Open Docker Desktop from Applications and leave it running

![Screenshot: Docker Desktop download page](assets/docker_download_page.png)

**Make sure it's actually running before moving on:**

Look at the menu bar at the top of your screen for the whale icon and click it.
It should say **"Engine running"**. If it says "Starting...", wait a minute.

![Screenshot: Docker whale icon in the Mac menu bar showing Engine running](placeholder-docker-engine-running-mac.png)

### Step 2: Download Internet Expedition

1. Go to the project page: `https://github.com/Ajitesh-Tamrakar/Bookmark`
2. Click the blue **Code** button, then click **Download ZIP**
3. Find the ZIP in your Downloads folder and double-click it to unzip
4. Move the **Internet Expedition** folder somewhere easy to find, like your Desktop

![Screenshot: Download ZIP button on the project page](assets/github_project_page.png)

### Step 3: Open a terminal inside that folder

1. Open **Spotlight** (press `Cmd + Space`), type **Terminal**, press Enter
2. In the Terminal window, type `cd ` (with a space after it), but don't press Enter yet
3. Drag the **Internet Expedition** folder from Finder straight into the Terminal window

![Screenshot: dragging the folder into Terminal to fill in the path](placeholder-drag-folder-terminal.png)

Terminal will automatically fill in the correct folder path. Now press **Enter**.

> 💡 If you see a **"New Terminal at Folder"** option when you right-click
> inside the folder in Finder, that works too. Either way gets you to the
> same place.

### Step 4: Start it up

In the Terminal window, type this exactly and press **Enter**:

```
docker compose up -d --build
```

![Screenshot: the command being pasted into Terminal](placeholder-paste-command-mac.png)

The first time you do this, it will take several minutes while it downloads
and builds everything. Lots of text scrolling by is normal.

### Step 5: How do you know it worked?

Terminal will return you to a normal prompt when it's done issuing the start
command. That doesn't mean the app is fully ready yet.

The reliable way to check:

1. Switch to the **Docker Desktop** app
2. Click **Containers** in the left sidebar
3. You should see a group of containers, all with a green dot next to them

![Screenshot: Docker Desktop Containers tab showing all services running](placeholder-containers-running.png)

Once everything is green, open Chrome and go to:

**http://localhost:8081**

> 💡 The very first time, it may take an extra minute or two while it finishes
> downloading the AI model in the background. If the page looks empty, wait
> a bit and refresh.

Continue to [Load the browser extension](#load-the-browser-extension) below.

---

## Linux Setup

1. Open a terminal
2. Clone the repo and run the install script:

```bash
git clone https://github.com/Ajitesh-Tamrakar/Bookmark.git
cd Bookmark
bash install.sh
```

`install.sh` handles everything for you:
- Checks that Docker is installed and running
- Detects an NVIDIA GPU and enables it automatically if present
- Builds and starts all the services
- Waits until the app is actually responding (not just "started")
- Opens `http://localhost:8081` in your default browser automatically
- Installs a `bookmark` command (`bookmark start`, `bookmark stop`, `bookmark status`) for future use, so you don't need to re-run `install.sh` after the first time

Continue to [Load the browser extension](#load-the-browser-extension) below.

---

## Load the browser extension

This part is the same on every operating system.

1. Open Chrome and go to `chrome://extensions`
2. Turn on **Developer mode** (the switch is in the top-right corner)
3. Click **Load unpacked**
4. Inside your Internet Expedition folder, select the **`extension`** folder itself (not a subfolder)

![Screenshot: Load unpacked dialog selecting the extension folder](placeholder-load-unpacked.png)

5. Click the **puzzle-piece icon** in Chrome's toolbar (top-right, next to the address bar)
6. Find **Internet Expedition** in the list and click the **pin** icon next to it, so it stays visible in your toolbar

![Screenshot: pinning the extension from the puzzle-piece menu](placeholder-pin-extension.png)

You're all set. From now on, click the pinned icon any time to open the app.
It'll take you straight to setup the first time, and straight to search after that.

---

## How to Use It

### Saving something

Whenever you find a video, post, pin, or article you want to remember:

1. Right-click anywhere on the page
2. Choose **Save to Internet Expedition** from the menu

![Screenshot: right-click menu showing the Save option](placeholder-save-menu.png)

No need to type anything or explain why you're saving it. The app
quietly reads and understands the content in the background.

Works on:
- YouTube videos
- Pinterest pins
- LinkedIn posts
- Twitter/X posts
- Any regular website or article

You can also save just a highlighted piece of text: select any text on a
page, right-click, and choose **Save highlight to Internet Expedition**.

![Screenshot: selecting text and saving it as a highlight](placeholder-save-highlight.png)

### Finding something later

You don't need to remember the title, the website, or even the exact topic.
Just describe it in your own words.

1. Click the pinned Internet Expedition icon in your Chrome toolbar
2. Type a description into the search bar, like:
   - "that video about negotiating a salary"
   - "the recipe with the lemon cake"
   - "post about someone switching careers into design"
3. Press Enter

![Screenshot: search bar with a typed query and matching results below](placeholder-search-results.png)

Click any result to open it again.

### A few tips

- Give it a minute after saving something. It needs a little time to "read" and understand what you saved before it shows up in search.
- The more naturally you describe what you're looking for, the better. You don't need exact keywords.
- Everything stays on your computer. Nothing is uploaded anywhere.

![Screenshot: closing image of the search results / library view](placeholder-final.png)
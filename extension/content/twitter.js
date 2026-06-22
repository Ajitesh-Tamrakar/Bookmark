function getOriginalImageUrl(url) {
    try {
        const parsed = new URL(url);
        parsed.searchParams.set("name", "orig");
        return parsed.toString();
    } catch {
        return url;
    }
}

const BUTTON_CLASS = "my-twitter-save-btn";

/* ===========================
   SCRAPE SINGLE TWEET
=========================== */

function extractTweet(tweet) {

    const tweetText =
        tweet.querySelector('[data-testid="tweetText"]')?.innerText || "";

    const statusLink = tweet.querySelector('a[href*="/status/"]');
    const tweetUrl = statusLink
        ? new URL(statusLink.getAttribute("href"), location.origin).href
        : null;

    const tweetId = tweetUrl?.match(/status\/(\d+)/)?.[1] || null;

    const authorName =
        tweet.querySelector('[data-testid="User-Name"] span')?.innerText || "";

    const usernameElement =
        [...tweet.querySelectorAll('a[href^="/"]')].find(a =>
            a.textContent.includes("@")
        );
    const username = usernameElement?.textContent || "";

    const timestamp =
        tweet.querySelector("time")?.getAttribute("datetime") || "";

    // Images — upgrade to original resolution
    const images = [
        ...tweet.querySelectorAll('img[src*="pbs.twimg.com/media"]')
    ].map(img => getOriginalImageUrl(img.src));

    // Videos — collect poster thumbnails + the tweet URL for context.
    // Twitter streams via HLS so video.src is always empty at scrape time.
    // We store the poster (thumbnail) and the tweet URL; your backend can
    // use yt-dlp / gallery-dl against tweetUrl to download the actual video.
    const videos = [
        ...tweet.querySelectorAll("video")
    ].map(video => ({
        poster: video.poster ? getOriginalImageUrl(video.poster) : null,
        // src will be empty for HLS — included for completeness/debug
        src: video.src || null,
    }));

    const hasMedia = images.length > 0 || videos.length > 0;

    source_url = tweetUrl; // For backward compatibility with older backend expecting source_url
    return {
        tweetId,
        source_url,
        authorName,
        username,
        timestamp,
        tweetText,
        images,
        videos,
        hasMedia,
        platform: "twitter",
        content_type: {'image': true, 'video': false, 'text': true},
        capture_method: "platform_injection",
    };
}

/* ===========================
   CREATE BUTTON
=========================== */

function createButton() {
    const button = document.createElement("button");
    button.className = BUTTON_CLASS;
    button.innerHTML = "📥";
    Object.assign(button.style, {
        background: "transparent",
        border: "none",
        cursor: "pointer",
        fontSize: "18px",
        padding: "8px",
        color: "#1d9bf0",
        marginLeft: "8px",
    });
    return button;
}

/* ===========================
   INJECT INTO TWEET
=========================== */

function injectButtonIntoTweet(tweet) {
    if (tweet.querySelector(`.${BUTTON_CLASS}`)) return;

    const buttons = tweet.querySelectorAll("button");
    if (!buttons.length) return;

    const lastButton = buttons[buttons.length - 1];
    const saveButton = createButton();
    lastButton.parentElement?.insertAdjacentElement("afterend", saveButton);
}

/* ===========================
   SCAN PAGE
=========================== */

function scanTweets() {
    document
        .querySelectorAll('article[data-testid="tweet"]')
        .forEach(injectButtonIntoTweet);
}

/* ===========================
   CLICK HANDLER
=========================== */

document.addEventListener("click", (event) => {
    const button = event.target.closest(".my-twitter-save-btn");
    if (!button) return;

    const tweet = button.closest('article[data-testid="tweet"]');
    if (!tweet) return;

    const payload = extractTweet(tweet);

    console.group("🚀 Sending Tweet Payload");
    console.log(payload);
    console.log(JSON.stringify(payload, null, 2));
    console.groupEnd();

    chrome.runtime.sendMessage({ type: "SAVE", data: payload }, (response) => {
        console.group("📨 Response From Background");
        console.log(response);
        if (chrome.runtime.lastError) {
            console.error("Runtime Error:", chrome.runtime.lastError);
        }
        console.groupEnd();
    });
});

/* ===========================
   DYNAMIC TWITTER LOADING
=========================== */

const observer = new MutationObserver(() => scanTweets());
observer.observe(document.body, { childList: true, subtree: true });

/* ===========================
   INITIAL LOAD
=========================== */

scanTweets();
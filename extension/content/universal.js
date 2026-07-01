const VIDEO_EMBED_PATTERNS = [
  /youtube(-nocookie)?\.com\/embed\//,
  /player\.vimeo\.com\/video\//,
];

function findLeadImage(articleEl) {
  const og = document.querySelector('meta[property="og:image"]')?.content;
  if (og) return og;

  const tw = document.querySelector('meta[name="twitter:image"]')?.content;
  if (tw) return tw;

  // Last resort: largest <img> by rendered dimensions inside the article body.
  // naturalWidth/naturalHeight reflect loaded state — see open question #3.
  const images = [...articleEl.querySelectorAll('img')];
  if (!images.length) return null;
  const largest = images.reduce((a, b) =>
    (a.naturalWidth * a.naturalHeight) >= (b.naturalWidth * b.naturalHeight) ? a : b
  );
  return largest.src || null;
}

function findEmbeddedVideo() {
  for (const iframe of document.querySelectorAll('iframe')) {
    const src = iframe.src || '';
    if (VIDEO_EMBED_PATTERNS.some(p => p.test(src))) return src;
  }

  const video = document.querySelector('video[src]');
  if (video) return video.src;

  const source = document.querySelector('video > source[src]');
  if (source) return source.src;

  return null;
}

function extractWebPage() {
  const docClone = document.cloneNode(true);
  const article = new Readability(docClone).parse(); // may return null on non-article pages

  let text, title, author;
  if (article) {
    text   = article.textContent;
    title  = article.title;
    author = article.byline ?? null;
  } else {
    text   = document.body.innerText; // C5: fallback when Readability can't parse
    title  = document.title;
    author = null;
  }

  return {
    mandatory_fields: {
      source_url:     location.href,
      platform:       "web",
      capture_method: "context_menu",
    },
    platform_specific_data: {
      text_content:       (text ?? "").trim(),
      title,
      author,
      lead_image_url:     findLeadImage(docClone),
      embedded_video_url: findEmbeddedVideo(),
    },
  };
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== "CAPTURE_WEB") return;
  const payload = extractWebPage();
  chrome.runtime.sendMessage({ type: "SAVE", data: payload }, sendResponse);
  return true; // keep message channel open for async sendResponse
});

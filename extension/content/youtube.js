function injectSaveButton() {

    // Prevent duplicates
    if (document.querySelector(".my-save-btn-wrapper")) {
        return;
    }

    // Find Share button wrapper
    const shareWrapper = document.querySelector(
        '#top-level-buttons-computed yt-button-view-model'
    );

    if (!shareWrapper) {
        return;
    }

    // Clone Share button
    const saveWrapper = shareWrapper.cloneNode(true);

    saveWrapper.classList.add("my-save-btn-wrapper");

    // Change text
    const text = saveWrapper.querySelector(
        '.ytSpecButtonShapeNextButtonTextContent'
    );

    if (text) {
        text.textContent = "Save";
    }

    // Find actual button
    const btn = saveWrapper.querySelector("button");
    const channel = document.querySelector(
        'ytd-video-owner-renderer ytd-channel-name a'
    );






    if (btn) {

        btn.setAttribute("aria-label", "Save");

        // Replace button to remove YouTube listeners
        const newBtn = btn.cloneNode(true);

        btn.parentNode.replaceChild(newBtn, btn);

        // Your click event
        newBtn.addEventListener("click", () => {

            const videoUrl = window.location.href;
            const title = document.title
            const author = channel ? channel.textContent.trim(): ''
            const authorLink = channel ? channel.href : ''

            const data = {
                'video_url': videoUrl,
                'title': title,
                'platform': 'Youtube',
                'content_type': 'video',
                'capture_method': 'Platform_injection',
                'author': author,
                authorLink: authorLink,
            }


            chrome.runtime.sendMessage({type: 'SAVE', data: data})
            console.log('capturedData', data);






            alert("Saved video!");
        });
    }

    // Add after Share button
    shareWrapper.after(saveWrapper);

    console.log("Save button injected");
}

// Observe page changes
const observer = new MutationObserver(() => {
    injectSaveButton();
});

// Start observer
observer.observe(document.body, {
    childList: true,
    subtree: true
});

// Initial run
injectSaveButton();
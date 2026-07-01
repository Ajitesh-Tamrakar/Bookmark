(function () {
    const AUTO_DISMISS_MS = 3000;
    const PANEL_SWAP_MS = 280;

    let overlayEl = null;
    let noteInputEl = null;
    let hideTimer = null;
    let currentBookmarkId = null;

    function buildOverlay() {
        const root = document.createElement("div");
        root.id = "bm-confirmation-toast";
        root.className = "bm-toast";
        root.innerHTML = `
            <div class="bm-panel bm-active" data-panel="confirmation">
                <div class="bm-drain-track"><div class="bm-drain-fill"></div></div>
                <div class="conf-inner">
                    <div class="conf-head">
                        <svg width="14" height="14" viewBox="0 0 24 24" style="flex:0 0 auto">
                            <path d="M6 3.5C6 2.67 6.67 2 7.5 2h9c.83 0 1.5.67 1.5 1.5v18l-7-4.5-7 4.5v-18z" fill="#ef9f27" stroke="#ef9f27" stroke-width="1.4" stroke-linejoin="round"/>
                            <circle cx="12" cy="9" r="1.7" fill="#0a0a0b"/>
                        </svg>
                        <span class="conf-title">Saved</span>
                        <button class="bm-close" type="button" aria-label="Dismiss">×</button>
                    </div>
                    <div class="conf-status">Indexing in background…</div>
                    <div class="conf-url"></div>
                    <div class="conf-footer">
                        <button class="bm-add-note" type="button">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>
                            Add note
                        </button>
                    </div>
                </div>
            </div>
            <div class="bm-panel" data-panel="note">
                <div class="note-inner">
                    <div class="note-head">
                        <span class="note-head-title">Add a note</span>
                        <button class="bm-close" type="button" aria-label="Dismiss">×</button>
                    </div>
                    <div class="note-ctx"></div>
                    <textarea class="bm-ta" placeholder="What do you want to remember about this?" rows="3"></textarea>
                    <div class="note-actions">
                        <button class="bm-cancel-btn" type="button">Cancel</button>
                        <button class="bm-save-btn" type="button">
                            Save note
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(root);

        noteInputEl = root.querySelector(".bm-ta");
        overlayEl = root;

        attachListeners(root);

        return root;
    }

    function getOverlay() {
        if (overlayEl && document.body.contains(overlayEl)) return overlayEl;
        return buildOverlay();
    }

    function switchPanel(toast, panelName) {
        const fromH = toast.offsetHeight;
        toast.style.height = fromH + "px";
        void toast.offsetHeight;

        toast.querySelectorAll(".bm-panel").forEach((p) => {
            p.classList.toggle("bm-active", p.dataset.panel === panelName);
        });

        toast.style.height = "auto";
        const toH = toast.offsetHeight;
        toast.style.height = fromH + "px";
        void toast.offsetHeight;

        requestAnimationFrame(() => {
            toast.style.height = toH + "px";
            setTimeout(() => {
                toast.style.height = "";
            }, PANEL_SWAP_MS);
        });
    }

    function restartDrain(toast) {
        const fill = toast.querySelector(".bm-drain-fill");
        if (!fill) return;
        fill.classList.remove("bm-draining");
        void fill.offsetWidth; // reflow — required to restart a finished CSS animation
        fill.classList.add("bm-draining");
        fill.style.animationPlayState = "";
    }

    function pauseDrain(toast) {
        const fill = toast.querySelector(".bm-drain-fill");
        if (fill) fill.style.animationPlayState = "paused";
    }

    function dismiss(toast) {
        if (hideTimer) {
            clearTimeout(hideTimer);
            hideTimer = null;
        }
        toast.classList.remove("bm-open");
        currentBookmarkId = null;
    }

    function attachListeners(toast) {
        if (toast.dataset.bmWired) return;
        toast.dataset.bmWired = "1";

        toast.querySelectorAll(".bm-close").forEach((btn) => {
            btn.addEventListener("click", () => dismiss(toast));
        });

        toast.querySelector(".bm-cancel-btn").addEventListener("click", () => dismiss(toast));

        toast.querySelector(".bm-add-note").addEventListener("click", () => {
            if (hideTimer) {
                clearTimeout(hideTimer);
                hideTimer = null;
            }
            pauseDrain(toast);
            switchPanel(toast, "note");
        });

        toast.querySelector(".bm-save-btn").addEventListener("click", () => {
            const note = noteInputEl.value.trim();
            if (note && currentBookmarkId) {
                chrome.runtime.sendMessage(
                    {
                        type: "ATTACH_NOTE",
                        data: { bookmark_id: currentBookmarkId, note },
                    },
                    () => {
                        void chrome.runtime.lastError; // suppress "unchecked lastError" warning
                    }
                );
            }
            dismiss(toast);
        });
    }

    window.bmShowConfirmation = function (bookmarkId) {
        currentBookmarkId = bookmarkId ?? null;
        const toast = getOverlay();

        noteInputEl.value = "";

        toast.querySelector(".conf-url").textContent =
            location.hostname + (document.title ? " · " + document.title : "");
        toast.querySelector(".note-ctx").textContent = document.title || location.hostname;

        const addNoteBtn = toast.querySelector(".bm-add-note");
        addNoteBtn.disabled = !currentBookmarkId;

        toast.querySelectorAll(".bm-panel").forEach((p) => {
            p.classList.toggle("bm-active", p.dataset.panel === "confirmation");
        });
        toast.style.height = "";

        toast.classList.add("bm-open");
        restartDrain(toast);

        if (hideTimer) clearTimeout(hideTimer);
        hideTimer = setTimeout(() => {
            hideTimer = null;
            dismiss(toast);
        }, AUTO_DISMISS_MS);
    };
})();

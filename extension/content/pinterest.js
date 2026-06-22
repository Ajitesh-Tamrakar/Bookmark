const BUTTON_CLASS = "my-pinterest-save-btn";

console.log("[PINTEREST-EXT] Loaded");

/* ===========================
   EXTRACT PIN
=========================== */

function extractPin(pin) {
    const img = pin.querySelector("img");

    const link =
        pin.querySelector('a[href*="/pin/"]');

    const mandatory_fields = {
        source_url: link?.href || "",
        platform: "pinterest",
        content_type: {
            'image': true,
            'video': false,
            'text': true,
        },
        capture_method: 'platform_injection',
    };

    const platform_specific_data = {
        pin_id: pin.dataset.testPinId || "",
        image_url: img?.src || "",
        image_srcset: img?.srcset || "",
        alt_text: img?.alt || ""
    };

    console.log("[PINTEREST-EXT] Extracted Pin Data", {
        mandatory_fields,
        platform_specific_data
    });
    return {        
        mandatory_fields,
        platform_specific_data
    };
}

/* ===========================
   BUTTON CLICK
=========================== */

function onButtonClick(event, pin) {
    event.preventDefault();
    event.stopPropagation();

    const payload = extractPin(pin);

    console.group("📌 Sending Pin Payload");
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
}
/* ===========================
   ADD BUTTON
=========================== */

function addButton(pin) {
    if (!pin) return;

    if (pin.querySelector(`.${BUTTON_CLASS}`)) {
        return;
    }

    const btn = document.createElement("button");

    btn.className = BUTTON_CLASS;
    btn.textContent = "Save";

    Object.assign(btn.style, {
        position: "absolute",
        top: "8px",
        right: "8px",
        zIndex: "999999",
        background: "#e60023",
        color: "#fff",
        border: "none",
        borderRadius: "999px",
        padding: "8px 12px",
        fontWeight: "600",
        cursor: "pointer"
    });

    btn.addEventListener("click", (e) =>
        onButtonClick(e, pin)
    );

    pin.style.position = "relative";
    pin.appendChild(btn);

    console.log(
        "[PINTEREST-EXT] Button added",
        pin.dataset.testPinId
    );
}

/* ===========================
   SCAN PINS
=========================== */

function scanPins() {
    const pins =
        document.querySelectorAll(
            '[data-test-id="pin"]'
        );

    if (!pins.length) {
        return;
    }

    pins.forEach(addButton);
}

/* ===========================
   WAIT FOR PINTEREST
=========================== */

let started = false;

const bootstrap = setInterval(() => {
    const pins =
        document.querySelectorAll(
            '[data-test-id="pin"]'
        );

    console.log(
        "[PINTEREST-EXT] Pins currently:",
        pins.length
    );

    if (!pins.length) {
        return;
    }

    if (!started) {
        started = true;

        console.log(
            "[PINTEREST-EXT] Pinterest feed detected"
        );

        scanPins();

        setInterval(scanPins, 2000);
    }

    clearInterval(bootstrap);

}, 1000);
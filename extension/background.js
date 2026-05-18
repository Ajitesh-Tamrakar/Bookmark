console.log("Background worker started");

chrome.runtime.onMessage.addListener((message) => {

    console.log("Received message in background:", message);

    if (message.type === 'SAVE') {

        const payload = message.data;

        fetch('http://127.0.0.1:8000/capture/save/', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(payload)

        })

        .then(response => {

            if (response.ok) {

                console.log("Data sent successfully");

            } else {

                console.error(
                    "Server responded with error:",
                    response.status
                );
            }
        })

        .catch(error => {

            console.error("Fetch failed:", error);

        });
    }
});
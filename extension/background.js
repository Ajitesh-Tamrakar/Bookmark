chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

    console.log("Received message in background:", message);

    if (message.type === 'SAVE') {

        const payload = message.data;

        fetch('http://127.0.0.1:8080/capture/save/', {

            method: 'POST',

            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify(payload)

        })
        .then(async (response) => {

            // Read backend response
            const data = await response.json();

            if (response.ok) {

                console.log("Data sent successfully");
                console.log("Server response:", data);

                sendResponse({
                    status: 'OK',
                    data: data
                });

            } else {

                console.error("Backend Error:");
                console.error("Status:", response.status);
                console.error("Response:", data);

                sendResponse({
                    status: 'ERROR',
                    code: response.status,
                    error: data
                });
            }
        })

        .catch((error) => {

            console.error("Fetch failed:", error);

            sendResponse({
                status: 'FETCH_ERROR',
                error: error.message
            });
        });

        // IMPORTANT
        return true;
    }
});
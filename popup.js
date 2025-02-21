document.addEventListener("DOMContentLoaded", function () {
    const toggleAI = document.getElementById("toggleAI");
    const statusText = document.getElementById("statusText");

    // Load stored setting and update UI
    chrome.storage.local.get(["aiEnabled"], (data) => {
        const isEnabled = data.aiEnabled !== false; // Default to true if not set
        toggleAI.checked = isEnabled;
        updateStatusText(isEnabled);
    });

    // Handle toggle switch click
    toggleAI.addEventListener("change", () => {
        const newState = toggleAI.checked;
        chrome.storage.local.set({ aiEnabled: newState }, () => {
            updateStatusText(newState);
        });
    });

    function updateStatusText(isEnabled) {
        statusText.textContent = isEnabled ? "Activated" : "Deactivated";
        statusText.className = isEnabled ? "status active" : "status inactive";
    }
});

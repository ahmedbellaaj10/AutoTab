document.addEventListener("DOMContentLoaded", function () {
    const toggleAI = document.getElementById("toggleAI");

    // Load stored setting (default: enabled)
    chrome.storage.local.get(["aiEnabled"], (data) => {
        toggleAI.checked = data.aiEnabled !== false; // Default to true if not set
    });

    // Handle toggle switch click
    toggleAI.addEventListener("change", () => {
        const newState = toggleAI.checked;
        chrome.storage.local.set({ aiEnabled: newState });
    });
});

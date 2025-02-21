console.log("AutoTab content script running...");

let activeInput = null;
let ghostSpan = null;
let debounceTimeout = null;
let loadingTimeout = null;
let lastAISuggestion = "";

// Function to create a ghost text overlay inside the input field
function createGhostTextElement(input) {
    if (ghostSpan) {
        ghostSpan.remove();
    }

    ghostSpan = document.createElement("span");
    const computedStyles = getComputedStyle(input); // Extract styles from the input field

    ghostSpan.style.position = "absolute";
    ghostSpan.style.pointerEvents = "none";
    ghostSpan.style.opacity = "0.4"; // Ensure faded effect
    ghostSpan.style.color = computedStyles.color; // Match text color
    ghostSpan.style.fontSize = computedStyles.fontSize;
    ghostSpan.style.fontFamily = computedStyles.fontFamily;
    ghostSpan.style.fontWeight = computedStyles.fontWeight;
    ghostSpan.style.letterSpacing = computedStyles.letterSpacing;
    ghostSpan.style.lineHeight = computedStyles.lineHeight;
    ghostSpan.style.whiteSpace = "pre-wrap";
    ghostSpan.style.padding = computedStyles.padding;
    ghostSpan.style.margin = computedStyles.margin;
    ghostSpan.style.border = computedStyles.border;
    ghostSpan.style.width = computedStyles.width;
    ghostSpan.style.height = computedStyles.height;
    ghostSpan.style.zIndex = "2";

    document.body.appendChild(ghostSpan);
}

// Function to position ghost text correctly
function positionGhostText(input) {
    if (!ghostSpan) return;

    const rect = input.getBoundingClientRect();
    ghostSpan.style.left = `${rect.left + window.scrollX}px`; 
    ghostSpan.style.top = `${rect.top + window.scrollY}px`;
    ghostSpan.style.width = `${input.clientWidth}px`;
    ghostSpan.style.height = `${input.clientHeight}px`;
}

// Function to remove ghost text when user types or moves cursor
function clearGhostText(event) {
    if (!activeInput) return;

    if (ghostSpan) {
        ghostSpan.remove();
        ghostSpan = null;
    }

    if (event && event.key === "Tab" && lastAISuggestion) {
        event.preventDefault(); // Prevent default tab behavior
        activeInput.value += lastAISuggestion; // Insert AI suggestion if Tab is pressed
        lastAISuggestion = "";
    }
}

// Function to request AI suggestion after delay
function requestAISuggestion(input) {
    let text = input.value.trim();

    if (text.length === 0) {
        lastAISuggestion = "";
        clearGhostText();
        return;
    }

    // Simulated AI-generated text (Replace with real AI call)
    lastAISuggestion = " everyone"; // Example suggestion

    // Show AI suggestion as faded ghost text overlay
    if (!ghostSpan) {
        createGhostTextElement(input);
    }
    positionGhostText(input);
    ghostSpan.textContent = text + lastAISuggestion;
}

// Debounced function to detect user inactivity (1 sec delay)
function handleTyping(event) {
    activeInput = event.target;

    clearTimeout(debounceTimeout);
    clearGhostText();

    debounceTimeout = setTimeout(() => {
        requestAISuggestion(activeInput);
    }, 1000);
}

// Attach event listener to all text fields (textarea + input)
function detectFields() {
    document.querySelectorAll("textarea, input[type='text'], input[type='search']").forEach(field => {
        field.addEventListener("input", handleTyping);
        field.addEventListener("focus", handleTyping);
        field.addEventListener("keydown", clearGhostText);
        field.addEventListener("click", clearGhostText);
    });
}

// Run detection when the script loads
detectFields();

// Also detect dynamically added fields
const observer = new MutationObserver(() => detectFields());
observer.observe(document.body, { childList: true, subtree: true });

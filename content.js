console.log("AutoTab content script running...");

let activeTextarea = null;
let ghostSpan = null;

// Function to create the ghost text overlay inside the textarea
function createGhostTextElement(textarea) {
    if (ghostSpan) {
        ghostSpan.remove(); // Remove old ghost text if it exists
    }

    // Create ghost text span inside the textarea's parent container
    ghostSpan = document.createElement("span");
    ghostSpan.style.position = "absolute";
    ghostSpan.style.pointerEvents = "none"; // Non-interactive
    ghostSpan.style.opacity = "0.4"; // Semi-transparent
    ghostSpan.style.color = "gray"; // Ghost text color
    ghostSpan.style.fontSize = getComputedStyle(textarea).fontSize;
    ghostSpan.style.fontFamily = getComputedStyle(textarea).fontFamily;
    ghostSpan.style.lineHeight = getComputedStyle(textarea).lineHeight;
    ghostSpan.style.padding = getComputedStyle(textarea).padding;
    ghostSpan.style.margin = getComputedStyle(textarea).margin;
    ghostSpan.style.whiteSpace = "pre-wrap"; // Preserve spaces & newlines
    ghostSpan.style.overflow = "hidden"; // Prevent text overflow
    ghostSpan.style.userSelect = "none"; // Prevent user selection
    ghostSpan.style.background = "transparent"; // Ensure it blends naturally
    ghostSpan.style.left = "0px";
    ghostSpan.style.top = "0px";
    ghostSpan.style.position = "absolute";
    ghostSpan.style.zIndex = "1"; // Ensure it's under the real text

    // Ensure it matches the textarea's exact width and height
    ghostSpan.style.width = `${textarea.clientWidth}px`;
    ghostSpan.style.height = `${textarea.clientHeight}px`;

    // Wrap textarea in a relative container for positioning
    const wrapper = document.createElement("div");
    wrapper.style.position = "relative";
    wrapper.style.display = "inline-block";
    wrapper.style.width = `${textarea.clientWidth}px`;
    wrapper.style.height = `${textarea.clientHeight}px`;

    textarea.parentNode.insertBefore(wrapper, textarea);
    wrapper.appendChild(ghostSpan);
    wrapper.appendChild(textarea);
}

// Function to update ghost text position
function positionGhostText(textarea) {
    if (!ghostSpan) return;
    ghostSpan.style.left = `${textarea.offsetLeft}px`;
    ghostSpan.style.top = `${textarea.offsetTop}px`;
}

// Function to detect user typing
function handleTyping(event) {
    activeTextarea = event.target;
    if (!ghostSpan) {
        createGhostTextElement(activeTextarea);
    }
    positionGhostText(activeTextarea);
    ghostSpan.textContent = activeTextarea.value + " ✨"; // Placeholder AI text for now
}

// Attach event listener to all textareas
function detectTextareas() {
    document.querySelectorAll("textarea").forEach(textarea => {
        textarea.addEventListener("input", handleTyping);
        textarea.addEventListener("focus", handleTyping);
    });
}

// Run detection when the script loads
detectTextareas();

// Also detect dynamically added textareas
const observer = new MutationObserver(() => detectTextareas());
observer.observe(document.body, { childList: true, subtree: true });

console.log("AutoTab content script running...");

// ===== Custom Undo/Redo Logic =====
// We'll store undo and redo stacks for each input element using WeakMaps.
const undoStacks = new WeakMap();
const redoStacks = new WeakMap();

// Push the current value onto the undo stack for the given input.
// If the new value is the same as the last one, we skip it.
function pushState(input) {
  let stack = undoStacks.get(input);
  if (!stack) {
    stack = [];
    undoStacks.set(input, stack);
  }
  if (stack.length === 0 || stack[stack.length - 1] !== input.value) {
    stack.push(input.value);
  }
  // Clear the redo stack on new input.
  redoStacks.set(input, []);
}

// Undo: if there's a previous state, revert to it.
function undo(input) {
  let stack = undoStacks.get(input) || [];
  let redoStack = redoStacks.get(input) || [];
  // Ensure there's at least one prior state to revert to.
  if (stack.length > 1) {
    const current = stack.pop();
    redoStack.push(current);
    input.value = stack[stack.length - 1];
    input.dispatchEvent(new Event("input", { bubbles: true }));
    redoStacks.set(input, redoStack);
  }
}

// Redo: if a state was undone, restore it.
function redo(input) {
  let redoStack = redoStacks.get(input) || [];
  let stack = undoStacks.get(input) || [];
  console.log("Redo stack length:", redoStack.length);
  if (redoStack.length > 0) {
    const state = redoStack.pop();
    input.value = state;
    stack.push(state);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    undoStacks.set(input, stack);
    redoStacks.set(input, redoStack);
  }
}

// ===== End Custom Undo/Redo Logic =====


// ===== Existing Ghost Overlay & Autocomplete Logic =====

// Inject a style tag for the bounce animation if it doesn't exist.
if (!document.getElementById("autotab-style")) {
  const style = document.createElement("style");
  style.id = "autotab-style";
  style.innerHTML = `
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `;
  document.head.appendChild(style);
}

let ghostSpan = null;
let debounceTimeout = null;
let activeInput = null;
let thinkingInterval = null;
let thinkingTimeout = null;

const finalSuggestion = " everyone";

// Create a ghost span appended to document.body.
function createGhostSpan(input) {
  if (ghostSpan) {
    ghostSpan.remove();
  }
  ghostSpan = document.createElement("span");
  ghostSpan.style.position = "absolute";
  ghostSpan.style.pointerEvents = "none";
  ghostSpan.style.opacity = "0.5";
  ghostSpan.style.color = "#aaa";
  ghostSpan.style.zIndex = "999999"; // On top of most elements

  // Copy relevant styling from the input.
  const computed = getComputedStyle(input);
  ghostSpan.style.fontSize = computed.fontSize;
  ghostSpan.style.fontFamily = computed.fontFamily;
  ghostSpan.style.fontWeight = computed.fontWeight;
  ghostSpan.style.letterSpacing = computed.letterSpacing;
  ghostSpan.style.lineHeight = computed.lineHeight;
  ghostSpan.style.whiteSpace = "pre-wrap";
  ghostSpan.style.background = "transparent";

  document.body.appendChild(ghostSpan);
}

// Position the ghostSpan to match the input's content area.
function positionGhostSpan(input) {
  const rect = input.getBoundingClientRect();
  const scrollX = window.scrollX || document.documentElement.scrollLeft;
  const scrollY = window.scrollY || document.documentElement.scrollTop;
  const computed = getComputedStyle(input);
  const padLeft = parseFloat(computed.paddingLeft) || 0;
  const padTop = parseFloat(computed.paddingTop) || 0;
  const padRight = parseFloat(computed.paddingRight) || 0;
  
  ghostSpan.style.left = (rect.left + scrollX + padLeft) + "px";
  ghostSpan.style.top = (rect.top + scrollY + padTop) + "px";
  ghostSpan.style.width = (rect.width - padLeft - padRight) + "px";
}

// Stop the dot animation and clear any pending finalization.
function stopThinkingIndicator() {
  if (thinkingInterval) clearInterval(thinkingInterval);
  thinkingInterval = null;
  if (thinkingTimeout) clearTimeout(thinkingTimeout);
  thinkingTimeout = null;
}

// Start cycling through three dots for a "thinking" effect,
// then finalize with " everyone" after 2 seconds.
function startThinkingIndicator(input) {
  stopThinkingIndicator(); // Clear any existing intervals/timeouts

  const frames = [".", "..", "..."];
  let frameIndex = 0;
  const userText = input.value;

  // Animate the dots every 500 ms.
  thinkingInterval = setInterval(() => {
    if (!ghostSpan) return;
    ghostSpan.textContent = userText + frames[frameIndex];
    frameIndex = (frameIndex + 1) % frames.length;
  }, 500);

  // After 2 seconds, replace with the final suggestion.
  thinkingTimeout = setTimeout(() => {
    if (!ghostSpan) return;
    stopThinkingIndicator(); // Stop the dot animation
    ghostSpan.textContent = userText + finalSuggestion;
  }, 2000);
}

// Remove the ghost overlay and stop any animations.
function clearGhost() {
  stopThinkingIndicator();
  if (ghostSpan) {
    ghostSpan.remove();
    ghostSpan = null;
  }
}

// If the user stops typing for 1 second, show the "thinking" indicator, then final suggestion.
function updateGhostText(input) {
  if (input.value.trim() === "") {
    clearGhost();
    return;
  }

  if (!ghostSpan) {
    createGhostSpan(input);
  }
  positionGhostSpan(input);
  startThinkingIndicator(input);
}

// ===== Event Handlers =====

function handleInput(event) {
  activeInput = event.target;
  // Push current state for undo.
  pushState(activeInput);
  clearGhost();
  if (debounceTimeout) clearTimeout(debounceTimeout);

  debounceTimeout = setTimeout(() => {
    updateGhostText(activeInput);
  }, 1000);
}

function handleKeyDown(event) {
  // Custom Undo/Redo Handling.
  if ((event.ctrlKey || event.metaKey) && !event.altKey) {
    if (event.key.toLowerCase() === "z") {
      event.preventDefault();
      if (event.shiftKey) {
        // Redo (Ctrl+Shift+Z or Ctrl+Y)
        redo(activeInput);
      } else {
        // Undo (Ctrl+Z)
        undo(activeInput);
      }
      clearGhost();
      return;
    } else if (event.key.toLowerCase() === "y") {
      event.preventDefault();
      redo(activeInput);
      clearGhost();
      return;
    }
  }
  
  // Accept suggestion on Tab.
  if (event.key === "Tab" && ghostSpan) {
    event.preventDefault();
    activeInput.value += finalSuggestion;
    // Dispatch an input event so that native or our custom undo/redo can capture the change.
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    clearGhost();
  } else {
    clearGhost();
  }
}

// ===== Attach Event Listeners =====

function attachListeners(field) {
  field.addEventListener("input", handleInput);
  field.addEventListener("keydown", handleKeyDown);
  field.addEventListener("focus", handleInput);
  field.addEventListener("click", handleInput);
  field.addEventListener("blur", clearGhost);
}

// Attach listeners to all existing text fields on the page.
document.querySelectorAll("textarea, input[type='text'], input[type='search']").forEach(attachListeners);
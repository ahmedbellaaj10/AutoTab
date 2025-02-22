console.log("AutoTab content script running...");

let ghostSpan = null;
let debounceTimeout = null;
let lastAISuggestion = " everyone";
let activeInput = null;

function createGhostSpan(input) {
  if (ghostSpan) {
    ghostSpan.remove();
  }
  ghostSpan = document.createElement("span");
  ghostSpan.style.position = "absolute";
  ghostSpan.style.pointerEvents = "none";
  ghostSpan.style.opacity = "0.5";
  ghostSpan.style.color = "#aaa";
  ghostSpan.style.zIndex = "999999"; // Ensure it's on top

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

function updateGhostText(input) {
  // If the input is empty, don't show any suggestion.
  if (input.value.trim() === "") {
    clearGhost();
    return;
  }
  
  if (!ghostSpan) {
    createGhostSpan(input);
  }
  
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
  
  ghostSpan.textContent = input.value + lastAISuggestion;
}

function clearGhost() {
  if (ghostSpan) {
    ghostSpan.remove();
    ghostSpan = null;
  }
}

function handleInput(event) {
  activeInput = event.target;
  clearGhost();
  if (debounceTimeout) clearTimeout(debounceTimeout);
  
  debounceTimeout = setTimeout(() => {
    updateGhostText(activeInput);
  }, 1000);
}

function handleKeyDown(event) {
  if (event.key === "Tab" && ghostSpan) {
    event.preventDefault();
    activeInput.value += lastAISuggestion;
    activeInput.dispatchEvent(new Event("input", { bubbles: true }));
    clearGhost();
  } else {
    clearGhost();
  }
}

function attachListeners(field) {
  field.addEventListener("input", handleInput);
  field.addEventListener("keydown", handleKeyDown);
  field.addEventListener("focus", handleInput);
  field.addEventListener("click", handleInput);
  field.addEventListener("blur", clearGhost);
}

document.querySelectorAll("textarea, input[type='text'], input[type='search']").forEach(attachListeners);

console.log("AutoTab content script loaded.");

// Function to detect textareas on the page
function detectTextareas() {
    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(textarea => {
        console.log("Found a textarea:", textarea);
    });
}

// Check if AI is enabled before running
chrome.storage.local.get(["aiEnabled"], (data) => {
    if (data.aiEnabled !== false) {
        console.log("AI is enabled. Running AutoTab...");
        detectTextareas();
    } else {
        console.log("AI is disabled. AutoTab will not run.");
    }
});




// document.addEventListener('DOMContentLoaded', () => {
//     textareas = document.getElementsByTagName('textarea');

//     console.log('textarea', textareas);

//     for (let i = 0; i < textareas.length; i++) {
//         textareas[i].addEventListener('input', () => {
//             let textarea_Content = textareas[i].value;
//             console.log("user is typing inside", textareas[i]);
//             console.log("text is", textarea_Content);
//         });
//     }
// });
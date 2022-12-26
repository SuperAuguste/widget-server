const ws = new WebSocket("ws://localhost");

const slidedown = document.getElementById("slidedown");
const slidedownContent = document.getElementById("slidedown__content");

let slidedownQueue = [];
let slidedownInProgress = false;
function slideItDown(text, bypass = false) {
    if (slidedownInProgress && !bypass) return slidedownQueue.push(text);

    slidedownInProgress = true;

    slidedownContent.innerText = text;
    slidedown.classList.add("shown");
    setTimeout(() => {
        slidedown.classList.remove("shown");
        if (slidedownQueue.length !== 0) {
            slideItDown(slidedownQueue.shift(), true);
        } else slidedownInProgress = false;
    }, 5000);
}

ws.onmessage = event => {
    const data = event.data;
    const message = JSON.parse(data);
    if (message.event === "follow") {
        // TODO: Make this have bold username while handling XSS
        slideItDown(`Thanks for the follow ${message.username}!`);
    }
}

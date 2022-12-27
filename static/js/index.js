const ws = new WebSocket("ws://localhost:6969");

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

function hexToHSL(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    r = parseInt(result[1], 16);
    g = parseInt(result[2], 16);
    b = parseInt(result[3], 16);
    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;
    if (max == min){
        h = s = 0;
    } else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return {h, s, l};
}

function tameColor(hex) {
    return `hsl(${hexToHSL(hex).h}turn, 50%, 55%)`;
}

let lastMessageAuthor = "";

ws.onmessage = event => {
    const data = event.data;
    const message = JSON.parse(data);
    if (message.event === "chat") {
        const message_div = document.createElement("div");
        message_div.classList.add("message");
    
        const message_author = document.createElement("span");
        message_author.classList.add("message__author");
        message_author.innerText = message.user.username + " ";
        
        if (message.user.color) {
            message_author.style.color = tameColor(message.user.color);
        } else {
            message_author.style.color = "red";
        }
        
        const message_content = document.createElement("span");
        message_content.classList.add("message__content");
        
        for (const m of message.message) {
            if (m.type === "text") {
                const t = document.createElement("span");
                t.innerText = m.text;
                message_content.append(t);
            } else if (m.type === "emote") {
                const t = document.createElement("img");
                t.classList.add("emote");
                t.src = m.url;
                message_content.append(t);
            }
        }

        if (message.user.username === lastMessageAuthor)
            message_author.style.visibility = "hidden";

        message_div.appendChild(message_author);
        message_div.appendChild(message_content);
        messages.appendChild(message_div);        

        lastMessageAuthor = message.user.username;
    } else if (message.event === "follow") {
        // TODO: Make this have bold username while handling XSS
        slideItDown(`Thanks for the follow ${message.username}!`);
    } else if (message.event === "reward") {
        if (message.reward === "Bouncing Ziguana") {
            slideItDown(`${message.username} redeemed a bouncing ziguana!`);
            const img = document.createElement("img");
            img.classList.add("ziguana");
            img.src = "https://cdn.discordapp.com/emojis/712478923388354602.png?size=512&quality=lossless";
            img.style.setProperty("--age", `0`);
            img.style.setProperty("--x", `${Math.random() * window.innerWidth}px`);
            img.style.setProperty("--y", `${Math.random() * window.innerHeight}px`);
            img.style.setProperty("--r", `${Math.random() * 2*Math.PI}rad`);
            document.body.appendChild(img);
        }
    }
}

function animate() {
    const ziguanas = document.querySelectorAll(".ziguana");
    for (const z of ziguanas) {
        let x = parseFloat(z.style.getPropertyValue("--x").replace("px", ""));
        let y = parseFloat(z.style.getPropertyValue("--y").replace("px", ""));
        let r = parseFloat(z.style.getPropertyValue("--r").replace("rad", ""));
        let age = parseInt(z.style.getPropertyValue("--age"));

        if (y <= 0 || y >= window.innerHeight) r += 0.33*Math.PI;
        if (x <= 0 || x >= window.innerWidth) r += 0.33*Math.PI;

        z.style.setProperty("--r", `${r}rad`);
        z.style.setProperty("--x", `${x + 1*Math.cos(r)}px`);
        z.style.setProperty("--y", `${y + 1*Math.sin(r)}px`);
        z.style.setProperty("--age", `${age + 1}`);

        if (age === 15_000) z.remove();
    }
    requestAnimationFrame(animate);
}

animate();

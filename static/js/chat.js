const messages = document.getElementById("messages");

const client = new tmi.Client({
	options: { debug: true },
	channels: [ "SuperAuguste" ]
});

let lastMessageAuthor = "";

client.connect().catch(console.error);
client.on("message", (channel, userstate, message, self) => {
	if (self) return;

    if (userstate["message-type"] === "chat") {
        const message_div = document.createElement("div");
        message_div.classList.add("message");
        
        console.log(userstate);

        const message_author = document.createElement("span");
        message_author.classList.add("message__author");
        message_author.innerText = userstate["display-name"] + " ";
        // TODO: Fix user colors
        // message_author.style.color = userstate.color;
        message_author.style.color = "red";
        
        const message_content = document.createElement("span");
        message_content.classList.add("message__content");
        message_content.innerText = message;

        if (userstate["display-name"] === lastMessageAuthor)
            message_author.style.visibility = "hidden";

        message_div.appendChild(message_author);
        message_div.appendChild(message_content);
        messages.appendChild(message_div);        

        lastMessageAuthor = userstate["display-name"];
    }
});

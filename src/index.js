import {config} from "dotenv";
config();

import {default as minimist} from "minimist";

const argv = minimist(process.argv.slice(2));

import {default as express} from "express";
import {promises as fs} from "fs";

import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";
import { ChatClient } from "@twurple/chat";

const tokenData = JSON.parse(await fs.readFile("./tokens.json", "UTF-8"));
const authProvider = new RefreshingAuthProvider(
	{
		clientId: process.env.CLIENT_ID,
		clientSecret: process.env.CLIENT_SECRET,
		onRefresh: async newTokenData => await fs.writeFile("./tokens.json", JSON.stringify(newTokenData, null, 4), "UTF-8")
	},
	tokenData
);

const apiClient = new ApiClient({ authProvider });
const listener = new EventSubWsListener({ apiClient });
if (!argv.offline) await listener.start();

const chatClient = new ChatClient({ authProvider, channels: ["superauguste"] });
if (!argv.offline) await chatClient.connect();

const USER_ID = "152436024";

listener.subscribeToChannelFollowEvents(USER_ID, event => {
    console.log("New follow", event.userName);
    for (const client of wss.clients) {
        try {
            client.send(JSON.stringify({
                event: "follow",
                username: event.userName,
            }));
        } catch {}
    }
});

listener.subscribeToChannelRedemptionAddEvents(USER_ID, event => {
    console.log("New redeem", event.userName);
    for (const client of wss.clients) {
        try {
            client.send(JSON.stringify({
                event: "reward",
                username: event.userName,
                reward: event.rewardTitle,
            }));
        } catch {}
    }
});

function processParsedMessage(data) {
    return data.map(_ => {
        if (_.type === "text") return {type: "text", text: _.text};
        if (_.type === "emote") return {type: "emote", name: _.name, url: _.displayInfo.getUrl({size: "2.0"})};
    });
}

let messages = [];

chatClient.onMessage((channel, user, text, msg) => {
    const message = {
        event: "chat",
        user: {
            username: msg.userInfo.userName,
            color: msg.userInfo.color,
        },
        message: processParsedMessage(msg.parseEmotes()),
    };
    messages.push(message);
    const str = JSON.stringify(message);
    for (const client of wss.clients) {
        client.send(str);
    }
})

let app = express();

app.use(express.static("static"))

app.get("/", (req, res) => {
    res.render("index.ejs", {});
});

app.get("/hi", (req, res) => {
    for (const client of wss.clients) {
        try {
            client.send(JSON.stringify({
                event: "follow",
                username: Math.random().toString(36).slice(2),
            }));
        } catch {}
    }
    res.end();
});

app.get("/redeem", (req, res) => {
    for (const client of wss.clients) {
        try {
            client.send(JSON.stringify({
                event: "reward",
                username: req.query.username || "testuser",
                reward: req.query.reward || "Bouncing Ziguana",
            }));
        } catch {}
    }
    res.end();
});

import {default as http} from "http";
import {WebSocketServer} from "ws";

const server = http.createServer(app);

const wss = new WebSocketServer({
    server,
});

wss.on("connection", client => {
    for (const message of messages) client.send(JSON.stringify(message));
});

server.listen(6969);

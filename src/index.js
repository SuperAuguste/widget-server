import {config} from "dotenv";
config();

import {default as express} from "express";
import {promises as fs} from "fs";

import { RefreshingAuthProvider } from "@twurple/auth";
import { ApiClient } from "@twurple/api";
import { EventSubWsListener } from "@twurple/eventsub-ws";

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
await listener.start();

const USER_ID = "152436024";

listener.subscribeToChannelFollowEvents(USER_ID, event => {
    console.log(event.userName);
    for (const client of wss.clients) {
        try {
            client.send(JSON.stringify({
                event: "follow",
                username: event.userName,
            }));
        } catch {}
    }
});

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

import {default as http} from "http";
import {WebSocketServer} from "ws";

const server = http.createServer(app);

const wss = new WebSocketServer({
    server,
});

wss.on("connection", () => {});

server.listen(80);

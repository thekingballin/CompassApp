import wisp from "wisp-server-node";
import fs from "fs";
import { createBareServer } from "@tomphttp/bare-server-node";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { bareModulePath } from "@mercuryworkshop/bare-as-module3";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import express from "express";
import { createServer } from "node:http";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Server as SocketIOServer } from "socket.io";

const bare = createBareServer("/bare/");
const __dirname = join(fileURLToPath(import.meta.url), "..");
const app = express();
const publicPath = "public";

const nicknames = new Set();
const chatLog = [];


app.use(express.static(publicPath));
app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));
app.use("/baremod/", express.static(bareModulePath));

app.use((req, res) => {
  res.status(404);
  res.sendFile(join(__dirname, publicPath, "404.html"));
});

const server = createServer((req, res) => {
  if (bare.shouldRoute(req)) {
    bare.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

const io = new SocketIOServer(server);

// Helper to broadcast active users count
function emitActiveUsersCount() {
  io.emit("active users", nicknames.size);
}

io.on("connection", (socket) => {
  let userNickname = null;

  socket.on("set nickname", (nickname, callback) => {
    nickname = nickname.trim().toLowerCase();

    if (nicknames.has(nickname)) {
      callback({ success: false, message: "Nickname already taken." });
      return;
    }

    const blacklistEncoded = [
      "YWRtaW4=", 
      "bW9k",     
      "c3lzdGVt", 
      "bmlnZ2E=",
      "bmlnZ2Vy",
      "ZnVjaw==", 
      "c2hpdA=="  
    ];
    const blacklist = blacklistEncoded.map(b64 =>
      Buffer.from(b64, "base64").toString("utf-8")
    );
    if (blacklist.some(word => nickname.includes(word))) {
      callback({ success: false, message: "That nickname is not allowed." });
      return;
    }

    userNickname = nickname;
    nicknames.add(nickname);
    callback({ success: true });

    emitActiveUsersCount();
    socket.emit("chat log", chatLog);
  });

  function logMessageToFile(msg) {
  const time = new Date(msg.time).toLocaleString();
  const line = `[${time}] [${msg.name}]: ${msg.text}\n`;
  fs.appendFile("chatlog.txt", line, (err) => {
    if (err) console.error("Failed to write chat log:", err);
  });
}

socket.on("chat message", (msg) => {
  if (!userNickname) return;

  if (msg.text.length > 300) return;

  const messageWithTime = {
    name: userNickname,
    text: msg.text,
    time: Date.now()
  };

  chatLog.push(messageWithTime);
  if (chatLog.length > 30) chatLog.shift();

  io.emit("chat message", messageWithTime);

  logMessageToFile(messageWithTime);
});


  socket.on("disconnect", () => {
    if (userNickname) {
      nicknames.delete(userNickname);
      emitActiveUsersCount();
    }
  });
});

server.on("upgrade", (req, socket, head) => {
  if (req.url.endsWith("/wisp/")) {
    wisp.routeRequest(req, socket, head);
  } else if (bare.shouldRoute(req)) {
    bare.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

let port = parseInt(process.env.PORT || "");
if (isNaN(port)) port = 8080;

server.listen(port, '0.0.0.0', () => {
  console.log(`Listening on port ${port} on all interfaces.`);
});

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

function shutdown() {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close();
  bare.close();
  process.exit(0);
}

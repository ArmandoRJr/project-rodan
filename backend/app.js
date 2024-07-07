import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import multer from "multer";
import "dotenv/config";
import fs from "fs";
import { v1 } from "@google-cloud/vision";
import fetch from "node-fetch";
import cors from "cors";
import prompts from "./prompts.js";

// #region Settings
//Initialize the express application and a server from that application
const app = express();

// Environment variables
const ENVIRONMENT = process.env.NODE_ENV;
const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);
const OPENAI_KEY = process.env.OPENAI_KEY;

// Express settings
const corsOptions = {
  origin:
    ENVIRONMENT === "production"
      ? "https://rodan.armandorojas.me"
      : "http://localhost:4200",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(bodyParser.json());
const port = 3000;

// Socket.io settings
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin:
      ENVIRONMENT === "production"
        ? "https://rodan.armandorojas.me"
        : "http://localhost:4200",
    credentials: true,
  },
});

// Multer
const upload = multer({ dest: "uploads/" });

// Vision API
const client = new v1.ImageAnnotatorClient({
  credentials: VISION_API_SETTINGS,
});

// WebSocket constants
// [TO BE UPDATED LATER]

// #endregion

//Variables for keeping track of users, players, scores, the currentRound, and a constant for setting the maximum number of rounds

let rooms = {};

//Handle connections to our WebSocket
io.on("connection", (socket) => {
  socket.on("message", (msg) => {
    console.log("message " + msg);

    io.emit(
      `message`,
      `${new Date().toLocaleTimeString("eo", {
        hour12: false,
      })} - ${socket.id.slice(0, 5)}...: ${msg.toUpperCase()}`
    );
  });

  socket.on("joinRoom", (roomId) => {
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: [],
        spectators: [],
        scores: {},
        round: 0,
        roundEndTime: null,
      };
    }

    if (rooms[roomId].users.length < 4) {
      rooms[roomId].users.push(socket.id);
      socket.join(roomId);
      socket.emit("playerJoined", { playerId: socket.id });
    } else {
      rooms[roomId].spectators.push(socket.id);
      socket.join(roomId);
      socket.emit("spectatorJoined", { spectatorId: socket.id });
    }

    io.to(roomId).emit("roomData", rooms[roomId]);

    if (rooms[roomId].users.length === 4) {
      startGame(roomId);
    }
  });

  socket.on("submitPicture", (roomId, picture) => {
    if (!rooms[roomId] || !rooms[roomId].roundEndTime) return;

    if (Date.now() > rooms[roomId].roundEndTime) {
      socket.emit("roundOver");
      return;
    }

    const score = Math.floor(Math.random() * 10) + 1;
    if (!rooms[roomId].scores[socket.id]) {
      rooms[roomId].scores[socket.id] = [];
    }
    rooms[roomId].scores[socket.id].push(score);
    io.to(roomId).emit("score", { userId: socket.id, score });
  });

  socket.on("disconnect", () => {
    console.log("user disconnected:", socket.id);
    for (let roomId in rooms) {
      rooms[roomId].users = rooms[roomId].users.filter(
        (id) => id !== socket.id
      );
      rooms[roomId].spectators = rooms[roomId].spectators.filter(
        (id) => id !== socket.id
      );
      if (
        rooms[roomId].users.length === 0 &&
        rooms[roomId].spectators.length === 0
      ) {
        delete rooms[roomId];
      }
    }
  });
});

const startGame = (roomId) => {
  rooms[roomId].round = 1;
  startRound(roomId);
};

const startRound = (roomId) => {
  rooms[roomId].roundEndTime = Date.now() + 60000; // 60 seconds from now
  io.to(roomId).emit("newRound", {
    round: rooms[roomId].round,
    endTime: rooms[roomId].roundEndTime,
  });

  setTimeout(() => {
    endRound(roomId);
  }, 60000);
};

const endRound = (roomId) => {
  if (!rooms[roomId]) return;

  rooms[roomId].roundEndTime = null;
  io.to(roomId).emit("roundEnded", rooms[roomId].scores);

  if (rooms[roomId].round < 10) {
    rooms[roomId].round += 1;
    startRound(roomId);
  } else {
    io.to(roomId).emit("gameOver", rooms[roomId].scores);
    delete rooms[roomId];
  }
};

app.post("/submit", upload.single("picture"), async (req, res) => {
  const time = req.body.time;
  const promptId = req.body.promptId;
  const file = req.file;

  const fileBuffer = fs.readFileSync(file.path);
  const base64File = fileBuffer.toString("base64");

  const request = {
    image: { content: base64File },
  };
  const [result] = await client.objectLocalization(request);
  const objects = result.localizedObjectAnnotations;

  const objectNames = [...new Set(objects.map((object) => object.name))];
  console.log(objectNames.toString());

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `
              I have a list of objects [${objectNames.toString()}]
              and this prompt (${prompts[promptId]}).
              Respond to me with a JSON object where each key is an
              object in the list and the value (in terms of a confidence
              score between 0 and 1) of how related
              the object is to the prompt.
              `,
        },
      ],
    }),
  });
  const data = await response.json();
  const content = data.choices[0].message.content;
  const contentJSON = JSON.parse(content);
  console.log(contentJSON, Object.values(contentJSON));

  const maxCloseness = Math.max(...Object.values(contentJSON));
  console.log(maxCloseness);

  // Doesn't have time nor Vision AI confidence in the score
  // Someone else can fix that
  res.json({ objects: contentJSON, score: maxCloseness });
});

app.get("/test", async (req, res) => {
  res.json({
    message: `This is a test. We are on ${ENVIRONMENT}; ${
      ENVIRONMENT === "production"
    }`,
  });
});

//start the server now
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

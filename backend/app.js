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

// #endregion

//Variables for keeping track of users, players, scores, the currentRound, and a constant for setting the maximum number of rounds
let users = 0;
let players = [];
let scores = {};
let currentRound = 1;
const maxRounds = 10;

//Handle connections to our WebSocket
io.on("connection", (socket) => {
  users++;
  players.push(socket);

  if (users < 2) {
    io.emit("warning", `There should be more players to start the game!`);
  } else if (users === 2) {
    io.emit("warning", ``);
  } else {
    socket.emit("warning", `You are a spectator.`);
  }

  //message handling
  socket.on("message", (msg) => {
    console.log("message " + msg);

    io.emit(
      `message`,
      `${msg.toUpperCase()} (there are also ${users} user(s))`
    );
  });

  socket.on("disconnect", () => {
    users--;
    players = players.filter((player) => player.id !== socket.id);
    console.log("User diconnected");
  });
});

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

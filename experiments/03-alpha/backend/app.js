import express from "express";
import http from "http";
import { Server } from "socket.io";
import bodyParser from "body-parser";
import multer from "multer";
import "dotenv/config";
import fs from "fs";
import { v1 } from "@google-cloud/vision";
import fetch from "node-fetch";

import prompts from "./prompts.js";

const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);

const client = new v1.ImageAnnotatorClient({
  credentials: VISION_API_SETTINGS,
});

const PORT = 3000;
const app = express();
const server = http.createServer(app);

//start up the server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:4200",
    credentials: true,
  }
});

app.use(bodyParser.json());

const upload = multer({dest: "uploads/"});

//Variables for keeping track of users, players, scores, the currentRound, and a constant for setting the maximum number of rounds
let users = 0;
let players = [];
let scores = {};
let currentRound = 0;
const maxRounds = 10;


//define the behaviour for a connect/disconnect from the websocket
io.on("connection", (socket) => {
  console.log("A user connected");
  users++;
  players.push(socket);

  if(users === 2){
    startGame();
  }

  socket.on("disconnect", () => {
    users--;
    players = players.filter(player => player !== socket);
    console.log("User diconnected");
  });
});

//constant function startGame that will initialize the game by storing all the correct values in the variables above and running the startRound constant function
const startGame = () => {
  if (users < 2) {
    console.log("Not enough players to start the game.");
    return;
  }

  currentRound = 1;

  scores = {};

  players.forEach(player => score[player.id] = 0);

  startRound();

};

const startRound = () => {
    if(currentRound > maxRounds) {
      endGame();
      return;
    }

    const promptId = Math.floor(Math.random() * prompts.length);
    const prompt = prompts[promptId];

    players.forEach(player => {
      player.emit("prompt", {promptId, prompt});
    });
};

//submit endpoint that awaits user submissions, and then scores them using google vision api and openai api, tracks the score for each player, and then starts the next round
app.post("/submit", upload.single("picture"), async(req, res) => {
  const {promptId, playerId} = req.body;
  const file = req.file;

  const fileBuffer = fs.readFileSync(file.path);
  const base64File = fileBuffer.toString("base64");

  const request = {
    image: {content: base64File},
  };

  const [result] = await client.objectLocalization(request);
  const objects = result.localizedObjectAnnotations;


  const objectNames = [...new Set(objects.map((object) => object.name))];

  const response = await fetch(`https://api.openai.com/v1/chat/completions`, {
      method: "POST",
      headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_KERY}`,
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
  const maxCloseness = Math.max(...Object.values(contentJSON));

  scores[playerId] += maxCloseness;

  res.json({objects: contentJSON, score: maxCloseness});

  if(Object.keys(scores).length === players.length){
    currentRound++;
    startRound();
  }


});

//endgame constant function that will announce the winner after the game is over
const endGame = () => {
  const winner = Object.keys(scores).reduce((a,b) => scores[a] > scores[b] ? a : b);
  players.forEach(player => player.emit("gameOver", {scores, winner}));
};

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});





  

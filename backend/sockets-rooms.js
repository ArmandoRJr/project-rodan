import { Server } from "socket.io";
import "dotenv/config";
import { getUserInfoSocket } from "./middleware/auth-socket.js";
import prompts from "./prompts.js";
import fetch from "node-fetch";
import { v1 } from "@google-cloud/vision";
import e from "cors";

const ENVIRONMENT = process.env.NODE_ENV;
const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);
const OPENAI_KEY = process.env.OPENAI_KEY;

const client = new v1.ImageAnnotatorClient({
  credentials: VISION_API_SETTINGS,
});

let matches = {};

const FIVE_SECONDS = 5000;
const EIGHT_SECONDS = 8000;
const SIXTY_SECONDS = 60000;

/*
  rooms = {
      roomId: {
          id: string,
          players: int[],
          playersReady: boolean[],
          spectators: int[],
          environment: string,
          preferredRounds: int,
      }
  },
  ...
*/
let rooms = {};
let connections = {};

// TODO: add matches object
/* 
  matches = {
    roomId: {
      state: "countdown" | "round",
      promptsLeft: string[],
      round: int,
      maxRound: int,
      startTime: int,
      endTime: int,
      scores: {
        playerId: int
      },
      points: {
        playerId: int
      }
      itemsInQueue: {
        playerId: string[]
      }

      // Round specific
      roundStats: array of:
        prompt: string
        chosenObjects: string[],
        submittedPicture: {
          playerId: {
            picture: file // Not there yet
            score: int
            bestObject :string
            objects: string[]
          }
        }
    }
  }
*/

export const setupSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin:
        ENVIRONMENT === "production"
          ? "https://rodan.armandorojas.me"
          : "http://localhost:4200",
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (token && token.startsWith("Bearer ")) {
      const user = await getUserInfoSocket(token);
      if (user === null) {
        const err = new Error("authentication error");
        next(err);
        socket.disconnect();
      } else {
        socket.user = user;
        next();
      }
    } else {
      const err = new Error("Authentication error");
      next(err);
      socket.disconnect();
    }
  });

  io.on("connection", (socket) => {
    console.log(`user connected: ${socket.id}`);

    socket.on("createRoom", (environment, preferredRounds) => {
      let roomId = crypto.randomUUID();
      while (roomId in rooms) {
        roomId = crypto.randomUUID();
      }
      rooms[roomId] = {
        id: roomId,
        players: [],
        playersReady: [],
        spectators: [],
        environment: environment ?? "home",
        preferredRounds: preferredRounds ?? 10,
      };

      socket.emit("createRoomRes", { room: rooms[roomId] });
    });

    socket.on("getRooms", () => {
      const roomsList = Object.values(rooms);
      roomsList.sort((a, b) => {
        if (a.id < b.id) {
          return -1;
        }
        if (a.id > b.id) {
          return 1;
        }
        return 0;
      });
      socket.emit("getRoomsRes", { rooms: roomsList });
    });

    socket.on("joinRoom", (roomId, userType) => {
      if (userType !== "player" && userType !== "spectator") {
        return socket.emit("joinRoomRes", { error: "User type is invalid" });
      }

      if (!(roomId in rooms)) {
        return socket.emit("joinRoomRes", {
          error: "Room number does not exist.",
        });
      }

      if (userType === "player" && rooms[roomId].players.length >= 4) {
        return socket.emit("joinRoomRes", {
          error: "Room already has too many players.",
        });
      }

      const userId = socket.user.id;
      if (
        rooms[roomId].players.includes(userId) ||
        rooms[roomId].spectators.includes(userId)
      ) {
        return socket.emit("joinRoomRes", { error: "User already in room." });
      }

      if (userId in connections) {
        return socket.emit("joinRoomRes", { error: "User already in room." });
      }

      if (userType === "player") {
        rooms[roomId].players.push(userId);
        rooms[roomId].playersReady.push(false);
      } else {
        rooms[roomId].spectators.push(userId);
      }
      connections[userId] = {
        roomId,
        socketId: socket.id,
        userType,
        username: socket.user.username,
      };

      if (roomId in matches) {
        if (!(userId in matches[roomId].scores)) {
          matches[roomId].scores[userId] = 0;
        }
        if (!(userId in matches[roomId].points)) {
          matches[roomId].points[userId] = 0;
        }
        if (!(userId in matches[roomId].itemsInQueue)) {
          matches[roomId].itemsInQueue[userId] = 0;
        }
      }

      //socket.emit("joinRoomRes", getRoomInfo(roomId));
      transmitRoomData(roomId);
    });

    socket.on("toggleReady", (roomId) => {
      if (!(roomId in rooms)) {
        return;
      }

      const userId = socket.user.id;
      if (rooms[roomId].players.includes(userId)) {
        const idx = rooms[roomId].players.indexOf(userId);
        rooms[roomId].playersReady[idx] = !rooms[roomId].playersReady[idx];

        transmitRoomData(roomId);
      }
    });

    socket.on("startGame", (roomId) => {
      if (!(roomId in rooms)) {
        return;
      }

      if (roomId in matches) {
        return;
      }

      rooms[roomId].playersReady = rooms[roomId].playersReady.map(
        (ready) => false
      );

      const startTime = Date.now();
      const endTime = startTime + FIVE_SECONDS;
      const roomMatch = {
        state: "countdown",
        promptsLeft: [...prompts[rooms[roomId].environment]],
        startTime: startTime,
        endTime: endTime,
        round: 0,
        maxRound: rooms[roomId].preferredRounds,
        scores: {},
        points: {},
        itemsInQueue: {},

        roundStats: [],
      };

      rooms[roomId].players.forEach((playerId, idx) => {
        roomMatch.scores[playerId] = 0;
        roomMatch.points[playerId] = 0;
        roomMatch.itemsInQueue[playerId] = [];
      });

      matches[roomId] = roomMatch;
      transmitRoomData(roomId);

      setTimeout(() => transitionCountdownToRound(roomId), FIVE_SECONDS);
    });

    socket.on("takePicture", (roomId, image) =>
      takePicture(roomId, image, socket)
    );

    socket.on("disconnect", () => {
      console.log("user disconnected:", socket.id);
      const userId = socket.user.id;
      if (userId in connections) {
        const roomId = connections[userId].roomId;
        delete connections[userId];
        if (roomId in rooms) {
          rooms[roomId].players = rooms[roomId].players.filter((id, idx) => {
            const val = id !== socket.user.id;
            if (!val) {
              rooms[roomId].playersReady.splice(idx, 1);
            }
            return val;
          });
          rooms[roomId].spectators = rooms[roomId].spectators.filter(
            (id) => id !== socket.user.id
          );

          if (rooms[roomId].players.length < 2 && roomId in matches) {
            delete matches[roomId];
          }
          transmitRoomData(roomId);
        }
      }
    });
  });

  // #region Functions

  const transitionCountdownToRound = (roomId) => {
    if (!(roomId in rooms) || !(roomId in matches)) {
      return;
    }

    if (matches[roomId].round === matches[roomId].maxRound) {
      // TODO: Save game to database
      delete matches[roomId];
      transmitRoomData(roomId);
    } else {
      matches[roomId].state = "round";
      const randomPromptIndex = Math.floor(
        Math.random() * matches[roomId].promptsLeft.length
      );
      const roundPrompt = matches[roomId].promptsLeft[randomPromptIndex];
      matches[roomId].promptsLeft.splice(randomPromptIndex, 1);

      const startTime = Date.now();
      const endTime = startTime + SIXTY_SECONDS;
      matches[roomId].startTime = startTime;
      matches[roomId].endTime = endTime;
      matches[roomId].roundStats.push({
        prompt: roundPrompt,
        chosenObjects: [],
        submittedPicture: {},
      });

      transmitRoomData(roomId);

      const round = matches[roomId].round;
      setTimeout(() => {
        if (
          roomId in matches &&
          round === matches[roomId].round &&
          endTime === matches[roomId].endTime
        ) {
          transitionRoundToCountdown(roomId);
        }
      }, SIXTY_SECONDS);
    }
  };

  const transitionRoundToCountdown = (roomId) => {
    if (!(roomId in rooms) || !(roomId in matches)) {
      return;
    }

    matches[roomId].state = "countdown";
    matches[roomId].round = matches[roomId].round + 1;
    const startTime = Date.now();
    const endTime = startTime + EIGHT_SECONDS;
    matches[roomId].startTime = startTime;
    matches[roomId].endTime = endTime;

    transmitRoomData(roomId);

    setTimeout(() => {
      if (roomId in matches && endTime === matches[roomId].endTime) {
        transitionCountdownToRound(roomId);
      }
    }, EIGHT_SECONDS);
  };

  const transmitRoomData = (roomId) => {
    let socketIds = [];
    if (!(roomId in rooms)) {
      return;
    }

    rooms[roomId].players.forEach((player) => {
      socketIds.push(connections[player].socketId);
    });
    rooms[roomId].spectators.forEach((spectator) => {
      socketIds.push(connections[spectator].socketId);
    });

    const roomInfo = getRoomInfo(roomId);

    socketIds.forEach((socketId) => {
      io.to(socketId).emit("receiveCurrentState", roomInfo);
    });
  };

  const takePicture = async (roomId, image, socket) => {
    const round = matches[roomId]?.round ?? 0;
    const startTime = matches[roomId]?.startTime ?? Date.now();
    const endTime = matches[roomId]?.endTime ?? Date.now();
    const nowTime = Date.now();

    try {
      const user = socket.user;
      if (!user || !image) {
        return;
      }

      if (!(roomId in rooms) || !(roomId in matches)) {
        return;
      }

      const request = {
        image: { content: image },
      };
      const [result] = await client.objectLocalization(request);
      const objects = result.localizedObjectAnnotations;

      const objectNames = [...new Set(objects.map((object) => object.name))];
      if (objectNames.length === 0) {
        throw new Error("No identifiable objects found. Try again, human.");
      }

      const response = await fetch(
        `https://api.openai.com/v1/chat/completions`,
        {
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
                    and this prompt (${
                      matches[roomId].roundStats[round].prompt
                    }).
                    Respond to me with a JSON object where each key is an
                    object in the list and the value (in terms of a confidence
                    score between 0 and 1) of how related
                    the object is to the prompt.
                    Don't be afraid to give low scores.
                    `,
              },
            ],
          }),
        }
      );
      const data = await response.json();
      const content = data.choices[0].message.content;
      const contentJSON = JSON.parse(content);

      const contentJSONClean = Object.keys(contentJSON).reduce((acc, key) => {
        acc[String(key)] = contentJSON[key];
        return acc;
      }, {});

      const [bestObject, bestValue] = Object.entries(contentJSONClean).reduce(
        (acc, [key, value]) => {
          return value > acc[1] ? [key, value] : acc;
        },
        ["", -Infinity]
      );

      let confidence = 0;
      const bestObjectIdx = objectNames.indexOf(bestObject);
      if (bestObjectIdx !== -1) {
        confidence = objects[bestObjectIdx].score;
      } else {
        throw new Error("Rodan's evaluation methods failed. Try again, human");
        confidence = 0.8;
      }

      const timeFactor =
        (endTime - nowTime) / 1000 / ((endTime - startTime) / 1000);
      const finalScore = Math.round(
        timeFactor *
          (bestValue !== -Infinity ? bestValue : 0) *
          (confidence >= 0.5 ? 1 : 0.7) *
          1000
      );

      // console.log({
      //   objects: contentJSONClean,
      //   score: bestValue,
      //   bestObject,
      //   bestObjectIdx,
      //   numerator: (endTime - nowTime) / 1000,
      //   denominator: (endTime - startTime) / 1000,
      //   userId: user.id,
      //   finalScore,
      //   currentPlayerScore: matches[roomId].scores[user.id],
      // });
      if (Date.now() < endTime && matches[roomId]?.state === "round") {
        // Picture and best object acquired successfully
        // + all actions finished before round ends
        // = log picture as part of user's repertoire
        const prevImageScore =
          matches[roomId].roundStats[round].submittedPicture[user.id]?.score ??
          0;

        matches[roomId].roundStats[round].chosenObjects.push(bestObject);
        matches[roomId].roundStats[round].submittedPicture[user.id] = {
          score: finalScore,
          bestObject,
          objects: objectNames,
        };

        matches[roomId].scores[user.id] =
          matches[roomId].scores[user.id] - prevImageScore + finalScore;

        let allPlayersSubmittedPics = true;
        rooms[roomId].players.forEach((playerId) => {
          if (
            !(playerId in matches[roomId].roundStats[round].submittedPicture)
          ) {
            allPlayersSubmittedPics = false;
          }
        });
        if (allPlayersSubmittedPics && matches[roomId]?.state === "round") {
          transitionRoundToCountdown(roomId);
        } else {
          transmitRoomData(roomId);
        }
      }
    } catch (err) {
      if (Date.now() < endTime) {
        socket.emit(
          "takePictureError",
          err.toString() ??
            "Rodan had an error scanning your image. Try again, mortal."
        );
      }
    }
  };

  const getRoomInfo = (roomId) => {
    if (!(roomId in rooms)) {
      return null;
    }

    let returnJSON = {};
    returnJSON["room"] = { ...rooms[roomId] };

    returnJSON["room"].players = returnJSON["room"].players.map((playerId) => {
      return { id: playerId, username: connections[playerId].username };
    });
    returnJSON["room"].spectators = returnJSON["room"].spectators.map(
      (playerId) => {
        return { id: playerId, username: connections[playerId].username };
      }
    );

    if (roomId in matches) {
      returnJSON["match"] = matches[roomId];
    }

    return returnJSON;
  };

  // #endregion
};

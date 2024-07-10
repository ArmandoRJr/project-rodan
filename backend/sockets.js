import { Server } from "socket.io";
import "dotenv/config";
import { getUserInfoSocket } from "./middleware/auth-socket.js";

const ENVIRONMENT = process.env.NODE_ENV;
const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);
const OPENAI_KEY = process.env.OPENAI_KEY;

let rooms = {};

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
};

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

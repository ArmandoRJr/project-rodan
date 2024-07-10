import { Server } from "socket.io";
import "dotenv/config";
import { getUserInfoSocket } from "./middleware/auth-socket.js";

const ENVIRONMENT = process.env.NODE_ENV;
const VISION_API_SETTINGS = JSON.parse(process.env.VISION_API_SETTINGS);
const OPENAI_KEY = process.env.OPENAI_KEY;

let matches = {};

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
      prompts: string[],
      promptsDone: string[],
      round: int,
      scores: {
        playerId: score
      },
      itemsInQueue: {
        playerId: []
      }

      // Round specific
      chosenObjects: string[],
      submittedPicture: {
        playerId: {
          score
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
        environment: environment ?? "nature",
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

      //socket.emit("joinRoomRes", getRoomInfo(roomId));
      transmitRoomData(roomId);
    });

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
          transmitRoomData(roomId);
        }
      }
    });
  });

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

  return returnJSON;
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

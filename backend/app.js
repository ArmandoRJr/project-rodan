import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

//Initialize the express application and a server from that application
const app = express();

const environment = process.env.NODE_ENV;

const corsOptions = {
  origin:
    environment === "production"
      ? "https://rodan.armandorojas.me"
      : "http://localhost:4200",
  credentials: true,
};
app.use(cors(corsOptions));

const server = http.createServer(app);

//Start up socket.io
const io = new Server(server, {
  cors: {
    origin:
      environment === "production"
        ? "https://rodan.armandorojas.me"
        : "http://localhost:4200",
    credentials: true,
  },
});
const port = 3000;

//Handle connections to our WebSocket

let users = 0;

io.on("connection", (socket) => {
  console.log("A user connected");
  users++;

  //message handling
  socket.on("message", (msg) => {
    console.log("message " + msg);

    io.emit(`message`, `${msg.toUpperCase()} AND ALSO ${users} USERS`);
  });

  socket.on("disconnect", () => {
    users--;
    console.log("user disconnected");
  });
});

app.get("/test", async (req, res) => {
  res.json({
    message: `This is a test. We are on ${environment}; ${
      environment === "production"
    }`,
  });
});

//start the server now
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

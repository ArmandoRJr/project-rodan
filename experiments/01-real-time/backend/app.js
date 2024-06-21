import express from "express";
import http from "http";
import { Server } from "socket.io";

//Initialize the express application and a server from that application
const app = express();
const server = http.createServer(app);

//Start up socket.io
const io = new Server(server);
const port = 3000;

//Handle connections to our WebSocket

io.on("connection", (socket) => {
    console.log("A user connected");

    //message handling
    socket.on("message", (msg) => {
        console.log("message " + msg);

        io.emit("message", msg);
    });

    socket.on("disconnect", () =>{
        console.log("user disconnected");
    });
})

//start the server now
server.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
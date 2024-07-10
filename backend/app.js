import express from "express";
import http from "http";
import bodyParser from "body-parser";
import "dotenv/config";
import cors from "cors";
import { sequelize } from "./datasource.js";
import { usersRouter } from "./routers/users_router.js";
import { setupSocketIO } from "./sockets-rooms.js";
import { testsRouter } from "./routers/tests_router.js";

// #region Settings
//Initialize the express application and a server from that application
const app = express();

// Environment variables
const ENVIRONMENT = process.env.NODE_ENV;

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

// Sequelize
try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
  console.log("Connection has been established successfully.");
} catch (error) {
  console.error("Unable to connect to the database:", error);
}

// #endregion

// #region WebSockets and endpoints

setupSocketIO(server);

app.use("/test", testsRouter);

app.use("/users", usersRouter);

// #endregion

//start the server now
server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

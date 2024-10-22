import express from "express";
import bodyParser from "body-parser";
import { sequelize } from "./datasource.js";
import { userRouter } from "./routers/user_router.js";
import { Token } from "./models/tokens.js";
import cors from "cors";

export const app = express();
const PORT = 3000;

// app.js

//const corsOptions = {
  //origin: "http://localhost:4200/",
  //credentials: true
//};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

app.use(express.static("static"));

//Authentication middleware that checks for a valid token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No web token" });
  }

  const dbToken = await Token.findOne({ where: { token: token } });

  if (dbToken == null) {
    return res.status(401).json({ error: "Invalid web token" });
  }

  if (new Date() > dbToken.expiresAt) {
    await dbToken.destroy();
    return res.status(401).json({ error: "Invalid web token" });
  }

  req.user = { username: dbToken.username, userId: dbToken.UserId };
  next();
};


app.use("/api/users/", userRouter);

try {
  await sequelize.authenticate();
  await sequelize.sync({ alter: { drop: false } });
} catch (error) {}

app.use(function (req, res, next) {
  next();
});

app.listen(PORT, (err) => {
  if (err) console.log(err);
  else console.log("HTTP server on http://localhost:%s", PORT);
});



//Verify token endpoint to check whether someone signing in has a valid token in localStorage
app.get("/api/verify-token", authenticateToken, async (req, res) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  const dbToken = await Token.findOne({ where: { token: token } });
  res
    .status(200)
    .json({ message: "Token is valid", valid: "true", token: dbToken });
});

app.post('/api/login', (req, res) => {
  // Handle POST request here
  console.log(req.body); // Print the POST request body to console
  res.redirect('http://localhost:4200/dashboard/')
});

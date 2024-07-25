import { Router } from "express";
import { User } from "../models/users.js";
import { randomBytes } from "crypto";
import bcrypt from "bcrypt";
import { Token } from "../models/tokens.js";
import { isAuthenticated } from "../middleware/auth.js";
import { OAuth2Client } from "google-auth-library";

export const usersRouter = Router();

const client = new OAuth2Client();

const createToken = async (userId) => {
  const expiresAt = new Date(Date.now() + 90 * 60 * 60 * 1000);
  const tokenString = randomBytes(32).toString("hex");
  const accessToken = await Token.create({
    token: tokenString,
    UserId: userId,
    expiresAt,
  });
  return accessToken;
};

usersRouter.post("/signup", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === undefined || password === undefined) {
    return res
      .status(422)
      .json({ error: "Invalid parameters for user signup." });
  }

  if (username.length <= 4) {
    return res
      .status(422)
      .json({ error: "Username must be more than 4 characters." });
  }

  if (password.length <= 4) {
    return res
      .status(422)
      .json({ error: "Password must be more than 4 characters." });
  }

  const tempUser = await User.findOne({ where: { username } });
  if (tempUser !== null) {
    return res.status(422).json({ error: "Username already exists." });
  }

  const user = User.build({
    username,
    password,
  });

  const saltRounds = 10;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hashedPassword = bcrypt.hashSync(req.body.password, salt);

  user.password = `${hashedPassword}`;
  try {
    await user.save();
  } catch {
    return res.status(422).json({ error: "User creation failed." });
  }

  const accessToken = await createToken(user.id);

  res.json({
    tokenType: "Bearer",
    token: accessToken.token,
    username,
    id: user.id,
  });
});

usersRouter.post("/signin", async (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (username === undefined || password === undefined) {
    return res
      .status(422)
      .json({ error: "Invalid parameters for user login." });
  }

  const user = await User.findOne({
    where: {
      username,
    },
  });
  if (user === null) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const hash = user.password;
  const result = bcrypt.compareSync(password, hash);

  if (!result) {
    return res.status(401).json({ error: "Incorrect username or password." });
  }

  const newAccessToken = await createToken(user.id);

  return res.json({
    tokenType: "Bearer",
    token: newAccessToken.token,
    username,
    id: user.id,
  });
});

usersRouter.post("/signbygoogle", async (req, res) => {
  try {
    const token = req.body.token;
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience:
        "108707921610-oqu0od2chsdml6im4d0vhvp7hbt8vmvi.apps.googleusercontent.com",
    });
    const userInfo = ticket.getPayload();
    if (userInfo === undefined) {
      throw new Error("");
    }

    const user = await User.findOne({ where: { googleId: userInfo.sub } });
    if (user) {
      const newAccessToken = await createToken(user.id);
      return res.json({
        tokenType: "Bearer",
        token: newAccessToken.token,
        username: user.username,
        id: user.id,
      });
    }

    const username = `${
      userInfo.family_name ??
      userInfo.given_name ??
      userInfo.name ??
      "GoogleUser"
    }${Math.floor(Math.random() * 99999) + 1}`;
    const newUser = User.build({
      username,
      password: bcrypt.hashSync(userInfo.sub, bcrypt.genSaltSync(10)),
      googleId: userInfo.sub,
    });

    try {
      await newUser.save();
    } catch {
      return res.status(422).json({ error: "User creation failed." });
    }

    const accessToken = await createToken(newUser.id);

    return res.json({
      tokenType: "Bearer",
      token: accessToken.token,
      username,
      id: newUser.id,
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Google sign process failed." });
  }
});

usersRouter.get("/signout", isAuthenticated, async (req, res) => {
  const [bearerString, token] = req.headers.authorization.split(" ");
  const accessToken = await Token.findOne({
    where: {
      token,
    },
  });

  accessToken.destroy();
  return res.json({ message: "User has signed out successfully." });
});

usersRouter.get("/me", isAuthenticated, async (req, res) => {
  return res.json({ username: req.user.username, id: req.user.id });
});

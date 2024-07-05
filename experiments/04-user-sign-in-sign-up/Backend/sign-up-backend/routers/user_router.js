import { Router } from "express";
import bcrypt from "bcrypt";
import { User } from "../models/user.js";
import { Token } from "../models/tokens.js";
import crypto from "crypto";

export const userRouter = Router();

//Sign in and sign up routers which create/read tokens and encrypt the users password and store it in the database.

userRouter.post("/signup", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    await User.create({ username: username, password: hashedPassword });
    return res.status(200).json({ message: "Sign-up-Succesful" });
  } catch (error) {
    return res.status(400).json({ error: "Failed to create user." });
  }
});

userRouter.post("/signin", async (req, res) => {
  try {
    const username = req.body.username;
    const password = req.body.password;
    const user = await User.findOne({ where: { username } });
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid username/password" });
    }

    let token = await Token.findOne({ where: { username: username } });
    if (!token) {
      token = crypto.randomBytes(100).toString("hex");
      await Token.create({
        token: token,
        username: username,
        UserId: user.id,
        expiresAt: expiresAt,
      });
    } else if (token.expiresAt >= Date.now()) {
      await Token.destroy({ where: { username: username } });
      token = crypto.randomBytes(100).toString("hex");
      await Token.create({
        token: token,
        username: username,
        UserId: user.id,
        expiresAt: expiresAt,
      });
    }
    return res.status(200).json({ message: "Login successful", token });
  } catch (error) {
    return res.status(400).json({ error: "Failed to log in." });
  }
});

//Grab a paginated list of users based on the current page in the request. only send username and user id, and not sensitive info like passwords.
userRouter.get("/", async (req, res) => {
  const limit = 10;
  let offset;
  let next_offset;
  let prev_offset;

  if (req.query.page) {
    offset = parseInt(req.query.page) * limit;
    next_offset = (parseInt(req.query.page) + 1) * limit;
    prev_offset = (parseInt(req.query.page) - 1) * limit;
  } else {
    offset = 0;
    next_offset = 1 * limit;
    prev_offset = -1 * limit;
  }

  const users = await User.findAll({
    limit: limit,
    offset: offset,
    order: [["createdAt", "DESC"]],
    attributes: { exclude: ["createdAt", "updatedAt", "password"] },
  });
  const next_users = await User.findAll({
    limit: limit,
    offset: next_offset,
    order: [["createdAt", "DESC"]],
    attributes: { exclude: ["createdAt", "updatedAt", "password"] },
  });
  const prev_users = await User.findAll({
    limit: limit,
    offset: prev_offset,
    order: [["createdAt", "DESC"]],
    attributes: { exclude: ["createdAt", "updatedAt", "password"] },
  });

  return res.json({ users, next_users, prev_users });
});

import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";

export const isAuthenticated = async function (req, res, next) {
  if (
    req.headers.authorization === undefined ||
    !req.headers.authorization.includes("Bearer ")
  ) {
    return res.status(401).json({ error: "Not authenticated." });
  }

  const [bearerString, token] = req.headers.authorization.split(" ");
  const accessToken = await Token.findOne({
    where: {
      token,
    },
  });

  if (!accessToken) {
    return res.status(401).json({ error: "Not Authenticated" });
  }

  if (accessToken.expiredAt < Date.now()) {
    accessToken.destroy();
    return res.status(401).json({ error: "Not Authenticated" });
  }

  req.user = await User.findOne({ where: { id: accessToken.UserId } });
  next();
};

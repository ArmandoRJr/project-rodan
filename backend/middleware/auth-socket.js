import { Token } from "../models/tokens.js";
import { User } from "../models/users.js";

export const getUserInfoSocket = async function (tokenString) {
  if (tokenString === undefined) {
    return null;
  }

  const [bearerString, token] = tokenString.split(" ");
  const accessToken = await Token.findOne({
    where: {
      token,
    },
  });

  if (!accessToken) {
    return null;
  }

  if (accessToken.expiredAt < Date.now()) {
    accessToken.destroy();
    return null;
  }

  return await User.findOne({ where: { id: accessToken.UserId } });
};

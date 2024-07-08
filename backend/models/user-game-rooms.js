import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";

export const UserGameRoom = sequelize.define("UserGameRoom", {
  role: {
    type: DataTypes.ENUM("player", "spectator"),
    allowNull: false,
  },
});

User.hasOne(UserGameRoom);

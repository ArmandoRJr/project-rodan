import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "./users.js";

export const GameRoom = sequelize.define("GameRoom", {
  lastActive: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

User.hasOne(GameRoom);

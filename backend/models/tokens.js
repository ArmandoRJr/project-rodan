import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";
import { User } from "../models/users.js";

export const Token = sequelize.define("Token", {
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false,
  },
});

Token.belongsTo(User);
User.hasMany(Token);

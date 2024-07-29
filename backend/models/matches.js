import { sequelize } from "../datasource.js";
import { DataTypes } from "sequelize";

export const Matches = sequelize.define("Match", {
  playerOneId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  playerTwoId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  playerThreeId: {
    type: DataTypes.INTEGER,
  },
  playerFourId: {
    type: DataTypes.INTEGER,
  },
  gameData: {
    type: DataTypes.JSON,
    allowNull: false,
  },
});

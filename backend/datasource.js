// datasource.js
import { Sequelize } from "sequelize";

import "dotenv/config";

export const sequelize = new Sequelize(
  `${process.env.POSTGRES_DB}`,
  `${process.env.POSTGRES_USER}`,
  `${process.env.POSTGRES_PASSWORD}`,
  {
    dialect: "postgres",
  }
);

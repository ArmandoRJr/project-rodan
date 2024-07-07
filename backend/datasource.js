// datasource.js
import { Sequelize } from "sequelize";

import "dotenv/config";

export const sequelize = new Sequelize({
  dialect: "postgres",
  database: `${process.env.POSTGRES_DB}`,
  username: `${process.env.POSTGRES_USER}`,
  password: `${process.env.POSTGRES_PASSWORD}`,
  host: `${process.env.POSTGRES_HOST}`,
});

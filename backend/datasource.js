// datasource.js
import { Sequelize } from "sequelize";

import "dotenv/config";

export const sequelize = new Sequelize({
  dialect: "postgres",
  database: `${process.env.POSTGRES_DB}`,
  username: `${process.env.POSTGRES_USER}`,
  password: `${process.env.POSTGRES_PASSWORD}`,
  host: `${process.env.POSTGRES_HOST}`,
  logging: (msg) => {
    if (msg.startsWith("Executing (default):")) {
      // Filter out these messages
    } else {
      console.error(msg); // Log other messages (typically errors)
    }
  },
});

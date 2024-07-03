// datasource.js
import { Sequelize } from "sequelize";

export const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "sign_up_test.sqlite",
});

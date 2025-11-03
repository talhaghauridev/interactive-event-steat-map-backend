import { Router } from "express";
import users from "./users.route";
const routes = Router();

routes.use("/users", users);

export default routes;

import { Router } from "express";
import { getUserById, createUser, getCacheStatus, clearCache } from "../controllers/users.controller";

const router = Router();

router.get("/:id", getUserById);
router.post("/", createUser);
router.get("/cache/status", getCacheStatus);
router.delete("/cache", clearCache);

export default router;

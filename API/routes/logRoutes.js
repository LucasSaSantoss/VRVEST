import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { registerLog,getLogs } from "../controllers/logController.js";

const router = express.Router();
router.get("/logs", authMiddleware, getLogs);
router.post("/createLog", registerLog);

export default router;

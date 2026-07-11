import express from "express";
import { getLogs } from "../controllers/logController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import { registerLog } from "../controllers/logController.js";

const router = express.Router();
router.get("/logs", authMiddleware, getLogs);
router.post("/createLog", registerLog);

export default router;

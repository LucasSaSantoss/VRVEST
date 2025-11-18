import express from "express";
import { registerLog } from "../controllers/logController.js";

const router = express.Router();
router.post("/createLog", registerLog);

export default router;

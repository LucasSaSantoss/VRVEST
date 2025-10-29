import express from "express";
import { getSectors } from "../controllers/sectorController.js";

const router = express.Router();
router.get("/sectors", getSectors);

export default router;

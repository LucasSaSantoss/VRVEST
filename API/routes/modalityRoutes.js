import express from "express";
import { getModalities } from "../controllers/modalityController.js";

const router = express.Router();
router.get("/modalities", getModalities);

export default router;

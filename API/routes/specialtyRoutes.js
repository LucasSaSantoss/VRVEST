import express from "express";
import { getSpecialties } from "../controllers/specialtyController.js";

const router = express.Router();
router.get("/specialties", getSpecialties);

export default router;

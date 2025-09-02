import express from "express";
import { createEmpl, getEmpl } from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmpl); // Criar Funcionários
router.get("/", getEmpl); // Listar Funcionários

export default router;

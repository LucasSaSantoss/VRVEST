import express from "express";
import {
  createEmpl,
  getEmpl,
  registrarKit,
  getOpenPendencies,
  updateEmpl,
  getCpf,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", createEmpl); // Criar Funcionários
router.get("/", getEmpl); // Listar Funcionários
router.post("/registrarKit", registrarKit); // Registra Pendência através do cpf
router.post("/pendencias", getOpenPendencies);
router.get("/verificar-cpf/:cpf", getCpf);
router.put("/:id", authMiddleware, updateEmpl); // Alterar Funcionários

export default router;

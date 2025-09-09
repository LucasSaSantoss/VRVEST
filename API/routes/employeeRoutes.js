import express from "express";
import {
  createEmpl,
  getEmpl,
  registrarKit,
  getOpenPendencies,
  updateEmpl
} from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createEmpl); // Criar Funcionários
router.get("/", getEmpl); // Listar Funcionários
router.post("/registrarKit", registrarKit); // Registra Pendência através do cpf
router.post("/pendencias", getOpenPendencies);
router.put("/:id", updateEmpl); // Alterar Funcionários

export default router;

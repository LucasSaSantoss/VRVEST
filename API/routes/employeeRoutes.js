import express from "express";
import {
  createEmpl,
  getEmpl,
  registrarKit,
  getOpenPendencies,
  updateEmpl,
  getCpf,
  devolverKit,
  createTempEmpl,
  carregaCpfCampos,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import multer from "multer";
import path from "path";
import { upload } from "../uploadConfig/uploadConfig.js";

const router = express.Router();

router.post("/", createEmpl); // Criar Funcionários
router.post("/tempEmpl", authMiddleware, upload.single("avatarImage"), createTempEmpl);
router.get("/", getEmpl); // Listar Funcionários
router.post("/registrarKit", registrarKit); // Registra Pendência através do cpf
router.post("/pendencias", getOpenPendencies);
router.post("/devolver", devolverKit); //Devolução de kits
router.get("/verificar-cpf/:cpf", getCpf);
router.get("/carregacampos/:cpf", carregaCpfCampos);
router.put("/:id", updateEmpl); // Alterar Funcionários

export default router;

import express from "express";
import { createUser, loginUser, getUsers, validateCpf } from "../controllers/userController.js";

const router = express.Router();

router.post("/", createUser);      // Criar usuário
router.post("/login", loginUser);  // Login
router.get("/", getUsers);         // Listar usuários
router.post("/", validateCpf);     // Valida Cpf

export default router;

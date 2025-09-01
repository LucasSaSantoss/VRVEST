import express from "express";
import { createEmpl, loginUser, getUsers } from "../controllers/employeeController.js";

const router = express.Router();

router.post("/", createUser);      // Criar usuário
router.post("/login", loginUser);  // Login
router.get("/", getUsers);         // Listar usuários

export default router;

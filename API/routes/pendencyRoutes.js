import express from "express";
import { getRegistros, baixarPendencias } from "../controllers/pendencyController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

// router.put("/baixar", authMiddleware, baixarPendencias);
// router.get("/", authMiddleware, getRegistros); // Listar Funcionários

router.put("/baixar", baixarPendencias);
router.get("/", getRegistros); // Listar Funcionários

export default router;

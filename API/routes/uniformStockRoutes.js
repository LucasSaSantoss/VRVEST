import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  adjustStock,
  createStockSize,
  discardStock,
  listStockSizes,
  listMovements,
  listUniformSizesCatalog,
  loanStockEntry,
  stockEntry,
  transferMainToLoan,
  reverseMovement,
} from "../controllers/uniformStockController.js";

const router = express.Router();

router.get("/sizes", authMiddleware, listStockSizes);
router.get("/sizes-catalog", authMiddleware, listUniformSizesCatalog);
router.post("/sizes", authMiddleware, createStockSize);
router.post("/entry", authMiddleware, stockEntry);
router.post("/loan-entry", authMiddleware, loanStockEntry);
router.post("/discard", authMiddleware, discardStock);
router.post("/adjustment", authMiddleware, adjustStock);
// [MANUTENCAO] Motivo: separar operação de transferência e exibir histórico de movimentações para operação.
// [MANUTENCAO] Impacto: reduz confusão no ajuste manual e aumenta rastreabilidade do estoque com usuário responsável.
// [MANUTENCAO] Data: 2026-05-19
// [MANUTENCAO] Autor: Márlon Etiene
router.post("/transfer-main-to-loan", authMiddleware, transferMainToLoan);
router.get("/movements", authMiddleware, listMovements);
router.post("/movements/:id/reverse", authMiddleware, reverseMovement);

export default router;

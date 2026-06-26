import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createUniformWithdrawal,
  createRetroactiveUniformWithdrawal,
  createUniformLoan,
  getEmployeeUniformSummary,
  getEmployeeUniformLoanSummary,
  getEmployeeUniformDpPendencies,
  getUniformSettings,
  listUniformExpirations,
  listUniformStockOptions,
  listUniformLoanStockOptions,
  listUniformWithdrawals,
  listUniformWithdrawalYears,
  listRetroactiveUniformWithdrawals,
  listOpenUniformWithdrawalValiditySummary,
  listUniformLoans,
  registerLegacyUniformReturn,
  returnUniformWithdrawalItems,
  returnUniformLoanItems,
  settleUniformWithdrawal,
  updateUniformAnnualLimit,
  updateUniformStockMovementPolicy,
} from "../controllers/uniformController.js";
import { listLegacyUniformBaselineAlerts } from "../controllers/uniformLegacyBaselineController.js";

const router = express.Router();

router.get("/employee/:cpf/summary", authMiddleware, getEmployeeUniformSummary);
router.get("/loan/employee/:cpf/summary", authMiddleware, getEmployeeUniformLoanSummary);
router.get("/dp/employee/:cpf/pendencies", authMiddleware, getEmployeeUniformDpPendencies);
router.get("/settings", authMiddleware, getUniformSettings);
router.put("/settings/annual-limit", authMiddleware, updateUniformAnnualLimit);
router.put("/settings/stock-movement-policy", authMiddleware, updateUniformStockMovementPolicy);
router.get("/stock-options", authMiddleware, listUniformStockOptions);
router.get("/loan/stock-options", authMiddleware, listUniformLoanStockOptions);
router.post("/withdraw", authMiddleware, createUniformWithdrawal);
// [MANUTENCAO] Motivo: registrar retiradas anteriores sem movimentar estoque atual.
// [MANUTENCAO] Impacto: rota exclusiva para supervisor, validada no controller.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
router.post("/withdraw/retroactive", authMiddleware, createRetroactiveUniformWithdrawal);
router.post("/loan/withdraw", authMiddleware, createUniformLoan);
router.get("/withdrawals", authMiddleware, listUniformWithdrawals);
// [MANUTENCAO] Motivo: filtro de ano do relatório deve exibir apenas anos existentes.
// [MANUTENCAO] Impacto: permite consultar todos os anos ou restringir por um ano real de retirada.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
router.get("/withdrawals/years", authMiddleware, listUniformWithdrawalYears);
// [MANUTENCAO] Motivo: dashboard precisa resumir cautelas abertas reais, sem usar base de planilha.
// [MANUTENCAO] Impacto: considera retiradas normais e anteriores com pendência ainda aberta.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
router.get(
  "/withdrawals/open-validity-summary",
  authMiddleware,
  listOpenUniformWithdrawalValiditySummary
);
// [MANUTENCAO] Motivo: consulta operacional dos registros de retirada anterior da Fase 1.
// [MANUTENCAO] Impacto: substitui o uso da consulta por planilha na tela de registros anteriores.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
router.get("/withdrawals/retroactive", authMiddleware, listRetroactiveUniformWithdrawals);
router.get("/reports/expirations", authMiddleware, listUniformExpirations);
router.get("/legacy-baselines/alerts", authMiddleware, listLegacyUniformBaselineAlerts);
// [MANUTENCAO] Motivo: a importação por planilha foi substituída pelo registro manual de retirada anterior.
// [MANUTENCAO] Impacto: mantém apenas a consulta histórica enquanto existirem dados já importados.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
router.get("/loans", authMiddleware, listUniformLoans);
router.post("/withdrawals/:id/return", authMiddleware, returnUniformWithdrawalItems);
router.post("/returns/legacy", authMiddleware, registerLegacyUniformReturn);
router.post("/loan/:id/return", authMiddleware, returnUniformLoanItems);
router.put("/withdrawals/:id/settlement", authMiddleware, settleUniformWithdrawal);

export default router;

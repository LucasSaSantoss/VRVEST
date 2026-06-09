import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createUniformWithdrawal,
  createUniformLoan,
  getEmployeeUniformSummary,
  getEmployeeUniformLoanSummary,
  getEmployeeUniformDpPendencies,
  getUniformSettings,
  listUniformExpirations,
  listUniformStockOptions,
  listUniformLoanStockOptions,
  listUniformWithdrawals,
  listUniformLoans,
  registerLegacyUniformReturn,
  returnUniformWithdrawalItems,
  returnUniformLoanItems,
  settleUniformWithdrawal,
  updateUniformAnnualLimit,
  updateUniformStockMovementPolicy,
} from "../controllers/uniformController.js";
import {
  importLegacyUniformBaselines,
  listLegacyUniformBaselineAlerts,
} from "../controllers/uniformLegacyBaselineController.js";

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
router.post("/loan/withdraw", authMiddleware, createUniformLoan);
router.get("/withdrawals", authMiddleware, listUniformWithdrawals);
router.get("/reports/expirations", authMiddleware, listUniformExpirations);
router.get("/legacy-baselines/alerts", authMiddleware, listLegacyUniformBaselineAlerts);
router.post("/legacy-baselines/import", authMiddleware, importLegacyUniformBaselines);
router.get("/loans", authMiddleware, listUniformLoans);
router.post("/withdrawals/:id/return", authMiddleware, returnUniformWithdrawalItems);
router.post("/returns/legacy", authMiddleware, registerLegacyUniformReturn);
router.post("/loan/:id/return", authMiddleware, returnUniformLoanItems);
router.put("/withdrawals/:id/settlement", authMiddleware, settleUniformWithdrawal);

export default router;

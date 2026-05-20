import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createUniformWithdrawal,
  getEmployeeUniformSummary,
  getEmployeeUniformDpPendencies,
  getUniformSettings,
  listUniformStockOptions,
  listUniformWithdrawals,
  returnUniformWithdrawalItems,
  settleUniformWithdrawal,
  updateUniformAnnualLimit,
} from "../controllers/uniformController.js";

const router = express.Router();

router.get("/employee/:cpf/summary", authMiddleware, getEmployeeUniformSummary);
router.get("/dp/employee/:cpf/pendencies", authMiddleware, getEmployeeUniformDpPendencies);
router.get("/settings", authMiddleware, getUniformSettings);
router.put("/settings/annual-limit", authMiddleware, updateUniformAnnualLimit);
router.get("/stock-options", authMiddleware, listUniformStockOptions);
router.post("/withdraw", authMiddleware, createUniformWithdrawal);
router.get("/withdrawals", authMiddleware, listUniformWithdrawals);
router.post("/withdrawals/:id/return", authMiddleware, returnUniformWithdrawalItems);
router.put("/withdrawals/:id/settlement", authMiddleware, settleUniformWithdrawal);

export default router;

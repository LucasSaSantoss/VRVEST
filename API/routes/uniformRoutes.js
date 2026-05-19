import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createUniformWithdrawal,
  getEmployeeUniformSummary,
  getUniformSettings,
  listUniformWithdrawals,
  settleUniformWithdrawal,
  updateUniformAnnualLimit,
} from "../controllers/uniformController.js";

const router = express.Router();

router.get("/employee/:cpf/summary", authMiddleware, getEmployeeUniformSummary);
router.get("/settings", authMiddleware, getUniformSettings);
router.put("/settings/annual-limit", authMiddleware, updateUniformAnnualLimit);
router.post("/withdraw", authMiddleware, createUniformWithdrawal);
router.get("/withdrawals", authMiddleware, listUniformWithdrawals);
router.put("/withdrawals/:id/settlement", authMiddleware, settleUniformWithdrawal);

export default router;

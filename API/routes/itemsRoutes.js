import express from "express";
import {
  createUniformItem,
  getItemsPrices,
  listUniformItems,
  changePrices,
  updateUniformItem,
} from "../controllers/itemsControllers.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.get("/items-info", getItemsPrices);
router.post("/items-change", changePrices);
router.get("/uniforms", authMiddleware, listUniformItems);
router.post("/uniforms", authMiddleware, createUniformItem);
router.put("/uniforms/:id", authMiddleware, updateUniformItem);

export default router;

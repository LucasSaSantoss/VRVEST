import express from "express";
import {
  getItemsPrices,
  changePrices,
} from "../controllers/itemsControllers.js";

const router = express.Router();
router.get("/items-info", getItemsPrices);
router.post("/items-change", changePrices);

export default router;

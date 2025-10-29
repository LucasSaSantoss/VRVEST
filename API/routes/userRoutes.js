// routes/userRoutes.js
import express from "express";
import {
  createUser,
  loginUser,
  getUsers,
  updateUser,
  updateUserPassword,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/users", authMiddleware, createUser);
router.post("/login", loginUser);
router.get("/users", getUsers);
router.put("/users/:id", authMiddleware, updateUser);
router.put("/passchange/:id", updateUserPassword);

export default router;

// routes/userRoutes.js
import express from "express";
import {
  createUser,
  loginUser,
  getUsers,
  updateUser,
} from "../controllers/userController.js";
import { authMiddleware } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/users", createUser);
router.post("/login", loginUser);
router.get("/users", getUsers);
router.put("/user/:id", authMiddleware, updateUser);

export default router;

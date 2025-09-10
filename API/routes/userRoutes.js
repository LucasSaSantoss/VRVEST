// routes/userRoutes.js
import express from "express";
import { createUser, loginUser, updateUser,getUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/users", createUser);
router.post("/login", loginUser);
router.get("/users", getUsers);
router.put("/:id", updateUser); // Alterar Funcionários

export default router;
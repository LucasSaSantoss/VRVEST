// routes/userRoutes.js
import express from "express";
import { createUser, loginUser, getUsers } from "../controllers/userController.js";

const router = express.Router();

router.post("/users", createUser);
router.post("/login", loginUser);
router.get("/users", getUsers);

export default router;
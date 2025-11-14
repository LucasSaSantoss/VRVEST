import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import pendencyRoutes from "./routes/pendencyRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import emailRoutes from "./routes/emailRoutes.js";
import { validaFuncTemp } from "./FuncoesAutomaticas/cronJobs.js";
import sectorRoutes from "./routes/sectorRoutes.js";
import modalityRoutes from "./routes/modalityRoutes.js";
import itemsRoutes from "./routes/itemsRoutes.js";
import specialtyRoutes from "./routes/specialtyRoutes.js";

import dotenv from "dotenv";
dotenv.config();
validaFuncTemp(); // Executa na inicialização

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/empl", authMiddleware, employeeRoutes);
app.use("/api/pend", pendencyRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/sec", sectorRoutes);
app.use("/api/mod", modalityRoutes);
app.use("/api/spe", specialtyRoutes);
app.use("/api/items", itemsRoutes);

app.listen(3000, () => console.log("Server rodando na porta 3000"));

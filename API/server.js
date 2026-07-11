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
import logRoutes from "./routes/logRoutes.js";
import uniformRoutes from "./routes/uniformRoutes.js";
import uniformStockRoutes from "./routes/uniformStockRoutes.js";

import dotenv from "dotenv";
dotenv.config();
validaFuncTemp();

const app = express();
app.use(cors());
// [MANUTENCAO] Motivo: permitir importações controladas de planilhas convertidas em JSON sem erro HTTP 413.
// [MANUTENCAO] Impacto: limite segue configurável por ambiente e não altera contratos das rotas existentes.
// [MANUTENCAO] Data: 2026-06-08
// [MANUTENCAO] Autor: Márlon Etiene
app.use(express.json({ limit: process.env.JSON_BODY_LIMIT || "2mb" }));

app.use("/api", userRoutes);
app.use("/api/empl", authMiddleware, employeeRoutes);
app.use("/api/pend", pendencyRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/sec", sectorRoutes);
app.use("/api/mod", modalityRoutes);
app.use("/api/spe", specialtyRoutes);
app.use("/api/items", itemsRoutes);
app.use("/api/log", logRoutes);
app.use("/api/uniforms", uniformRoutes);
app.use("/api/uniform-stock", uniformStockRoutes);

app.listen(3000, () => console.log("Server rodando na porta 3000"));

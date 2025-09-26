import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import pendencyRoutes from "./routes/pendencyRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import emailRoutes from "./routes/emailRoutes.js";
import { validaFuncTemp } from "./FuncoesAutomaticas/cronJobs.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/", userRoutes);
app.use("/empl", authMiddleware, employeeRoutes);
app.use("/pend", pendencyRoutes);
app.use("/email", emailRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

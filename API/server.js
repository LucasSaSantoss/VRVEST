import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import pendencyRoutes from "./routes/pendencyRoutes.js";
import { authMiddleware } from "./middlewares/authMiddleware.js";
import emailRoutes from "./routes/emailRoutes.js";
import { validaFuncTemp } from "./FuncoesAutomaticas/cronJobs.js";
import dotenv from "dotenv";
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", userRoutes);
app.use("/api/empl", authMiddleware, employeeRoutes);
app.use("/api/pend", pendencyRoutes);
app.use("/api/email", emailRoutes);

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);
// app.use(express.static(path.join(__dirname, "dist")));
// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "dist", "index.html"));
// });

// const PORT = process.env.PORT || 3000;
// const HOST = "0.0.0.0"; // aceita conexões externas

// app.listen(PORT, HOST, () => {
//   console.log(`Servidor rodando em http://${HOST}:${PORT}`);
// });

app.listen(3000, () => console.log("Server rodando na porta 3000"));
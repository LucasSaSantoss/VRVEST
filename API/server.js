import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
// import pendencyRoutes from "./routes/pendencyRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", userRoutes);
app.use("/empl", employeeRoutes);
// app.use("/pend", pendencyRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

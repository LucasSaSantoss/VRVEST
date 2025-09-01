import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// import pendencyRoutes from "./routes/pendencyRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());
app.use("/", userRoutes);
// app.use("/employees", employeeRoutes);
// app.use("/pendencies", pendencyRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

import express from "express";
import cors from "cors";

// Importar rotas
import userRoutes from "./routes/userRoutes.js";
// import employeeRoutes from "./routes/employeeRoutes.js";
// import pendencyRoutes from "./routes/pendencyRoutes.js";

const app = express();

// Permitir todas as origens (desenvolvimento)
app.use(cors());

// Permitir JSON no corpo das requisições
app.use(express.json());

// Suas rotas
app.use("/usuarios", userRoutes);
// app.use("/employees", employeeRoutes);
// app.use("/pendencies", pendencyRoutes);

app.listen(3000, () => console.log("Servidor rodando na porta 3000"));

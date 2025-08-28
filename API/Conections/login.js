import express from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const app = express();
app.use(express.json());

const JWT_SECRET = "chave_secreta_Lucas";

function autenticarToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; 
  

  if (!token) {
    return res.status(401).json({ message: "Token não fornecido" });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token inválido" });
    req.user = user; 
    next();
  });
}

app.post("/usuarios", async (req, res) => {
  try {
    const { name, email, password, sector, position, level } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    const novoUsuario = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        sector,
        position,
        level: level,
      },
    });

    res.status(201).json({ message: "Usuário criado com sucesso", id: novoUsuario.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  console.log("Chegou aqui")
  try {
    const users = await prisma.user.findUnique({ where: { email } });
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
    }

    for (const user of users) {
      const senhaValida = await bcrypt.compare(password, user.password);
      if (senhaValida) {
        const token = jwt.sign(
          { userId: user.id, email: user.email },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({ success: true, token });
      }
    }

    return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get("/usuarios", autenticarToken, async (req, res) => {
  try {
    const filtros = {};
    if (req.query.id) filtros.id = Number(req.query.id);
    if (req.query.name) filtros.name = req.query.name;
    if (req.query.email) filtros.email = req.query.email;
    if (req.query.sector) filtros.sector = req.query.sector;
    if (req.query.position) filtros.position = req.query.position;
    if (req.query.level) filtros.level = Number(req.query.level);

    const users = await prisma.user.findMany({ where: filtros });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.put("/usuarios/:id", autenticarToken, async (req, res) => {
  try {
    const usuarioAtualizado = await prisma.user.update({
      where: { id: Number(req.params.id) },
      data: {
        name: req.body.name,
        email: req.body.email,
        sector: req.body.sector,
        position: req.body.position,
        level: Number(req.body.level),
      },
    });
    res.status(200).json(usuarioAtualizado);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: err.message });
  }
});


app.delete("/usuarios/:id", autenticarToken, async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: Number(req.params.id) } });
    res.status(200).json({ message: "Usuário excluído com sucesso" });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    res.status(500).json({ error: err.message });
  }
});


app.get("/perfil", autenticarToken, async (req, res) => {
  const usuario = await prisma.user.findUnique({
    where: { id: req.user.userId },
  });
  res.json({ message: "Perfil do usuário", usuario });
});

app.listen(3000, () => console.log("🚀 Servidor rodando na porta 3000"));

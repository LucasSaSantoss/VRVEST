import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.post("/usuarios", async (req, res) => {
  const novoUsu = await prisma.user.create({
    data: {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
      sector: req.body.sector,
      position: req.body.position,
      Level: parseInt(req.body.Level),
    },
  });

  res.status(201).json(novoUsu);
});

app.get("/usuarios", async (req, res) => {
  try {
    const filtros = {};
    if (req.query.id !== undefined) filtros.id = parseInt(req.query.id);
    if (req.query.name) filtros.name = req.query.name;
    if (req.query.email) filtros.email = req.query.email;
    if (req.query.sector) filtros.sector = req.query.sector;
    if (req.query.position) filtros.position = req.query.position;
    if (req.query.level !== undefined)
      filtros.Level = parseInt(req.query.Level);

    const users = await prisma.user.findMany({ where: filtros });
    res.status(200).json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/usuarios/:id", async (req, res) => {
  const alterUsu = await prisma.user.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: {
      name: req.body.name,
      email: req.body.email,
      sector: req.body.sector,
      position: req.body.position,
      Level: parseInt(req.body.Level),
    },
  });

  res.status(201).json(alterUsu);
});

app.delete("/usuarios/:id", async (req, res) => {
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

app.listen(3000);

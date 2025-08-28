import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.post("/pend", async (req, res) => {
  await prisma.pendency.create({
    data: {
      emplID: parseInt(req.body.emplID),
      emplName: req.body.emplName,
      userId: parseInt(req.body.userId),
      userName: req.body.userName,
      date: req.body.date,
      status: parseInt(req.body.status),
      kitSize: parseInt(req.body.kitSize),
    },
  });

  res.status(201).json(req.body);
});

app.get("/pend", async (req, res) => {
  try {
    const filtros = {};
    if (req.query.id !== undefined) filtros.id = parseInt(req.query.id);
    if (req.query.emplID) filtros.emplID = parseInt(req.query.emplID);
    if (req.query.emplName) filtros.emplName = req.query.emplName;
    if (req.query.userId) filtros.userId = parseInt(req.query.userId);
    if (req.query.userName) filtros.userName = req.query.userName;
    if (req.query.date) filtros.date = req.query.date;
    if (req.query.status !== undefined) filtros.status = parseInt(req.query.status);
    if (req.query.kitSize !== undefined) filtros.kitSize = parseInt(req.query.kitSize);


    const pends = await prisma.pendency.findMany({ where: filtros });
    res.status(200).json(pends);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/pend/:id", async (req, res) => {
  await prisma.pendency.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: {
      emplID: parseInt(req.body.emplID),
      emplName: req.body.emplName,
      userId: parseInt(req.body.userId),
      userName: req.body.userName,
      date: req.body.date,
      status: parseInt(req.body.status),
      kitSize: parseInt(req.body.kitSize),
    },
  });

  res.status(201).json(req.body);
});

app.delete("/pend/:id", async (req, res) => {
  await prisma.pendency.delete({
    where: {
      id: parseInt(req.params.id),
    },
  });
  res.status(200).json({ message: "Usuário excluído com sucesso" });
});

app.listen(3000);

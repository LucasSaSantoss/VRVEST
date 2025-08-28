import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();
app.use(express.json());

app.post("/func", async (req, res) => {
  await prisma.employee.create({
    data: {
      name: req.body.name,
      cpf: req.body.cpf,
      email: req.body.email,
      password: req.body.password,
      sector: req.body.sector,
      position: req.body.position,
      numPend:req.body.numPend,
      cadUserID: parseInt(req.body.cadUserID),
      cadUserName:req.body.cadUserName,
      modality: parseInt(req.body.modality),
    },
  });

  res.status(201).json(req.body);
});

app.get("/func", async (req, res) => {
  try {
    const filtros = {};
    if (req.query.id !== undefined) filtros.id = parseInt(req.query.id);
    if (req.query.cpf) filtros.name = req.query.name;
    if (req.query.email) filtros.email = req.query.email;
    if (req.query.password) filtros.password = req.query.password;
    if (req.query.sector) filtros.sector = req.query.sector;
    if (req.query.position) filtros.position = req.query.position;
    if (req.query.numPend !== undefined) filtros.numPend = parseInt(req.query.numPend);
    if (req.query.cadUserID !== undefined) filtros.cadUserID = parseInt(req.query.cadUserID);
    if (req.query.cadUserName !== undefined) filtros.cadUserName = req.query.cadUserName;
    if (req.query.modality !== undefined) filtros.modality = parseInt(req.query.modality);


    const funcs = await prisma.employee.findMany({ where: filtros });
    res.status(200).json(funcs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put("/func/:id", async (req, res) => {
  await prisma.employee.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: {
      name: req.body.name,
      cpf: req.body.cpf,
      email: req.body.email,
      password: req.body.password,
      sector: req.body.sector,
      position: req.body.position,
      numPend:req.body.numPend,
      cadUserID: parseInt(req.body.cadUserID),
      cadUserName:req.body.cadUserName,
      modality: parseInt(req.body.modality),
    },
  });

  res.status(201).json(req.body);
});

app.delete("/func/:id", async (req, res) => {
  await prisma.employee.delete({
    where: {
      id: parseInt(req.params.id),
    },
  });
  res.status(200).json({ message: "Usuário excluído com sucesso" });
});

app.listen(3000);

// controllers/userController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createEmpl = async (req, res) => {
  try {
    const { name, cpf, email, sector, position, modality } = req.body;

    const existingEmpl = await prisma.employee.findUnique({ where: { email } });
    if (existingEmpl)
      return res.status(400).json({ message: "Email já registrado" });

    const validCpf = await prisma.employee.findUnique({ where: { cpf } });
    if (validCpf) return res.status(400).json({ message: "CPF já registrado" });

    // Dados do usuário logado
    const cadUserID = req.user.id;
    const cadUserName = req.user.name;

    const newEmpl = await prisma.employee.create({
      data: {
        name,
        cpf,
        email,
        sector,
        position,
        cadUserID,
        cadUserName,
        modality,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Funcionário criado", id: newEmpl.id });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "CPF ou Email já cadastrado" });
    }
    console.error("Erro ao criar Funcionário:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

export const getEmpl = async (req, res) => {
  try {
    const empl = await prisma.employee.findMany();
    res.status(200).json(empl);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao listar funcionários" });
  }
};

export const registrarKit = async (req, res) => {
  try {
    const { cpf, kitSize } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({ where: { cpf } });
    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    // Dados do usuário logado
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;

    // Cria a pendência
    const pendencia = await prisma.pendency.create({
      data: {
        emplID: funcionario.id,
        emplName: funcionario.name,
        userId: usuarioID,
        userName: usuarioName,
        date: new Date(),
        kitSize: kitSize,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Saída de kit registrada", pendencia });
  } catch (err) {
    console.error("Erro ao registrar kit:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

// Consulta pendências abertas de um funcionário pelo CPF
export const getOpenPendencies = async (req, res) => {
  try {
    const { cpf } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({ where: { cpf } });
    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    // Busca pendências com status 1
    const pendencias = await prisma.pendency.findMany({
      where: { emplID: funcionario.id, status: 1 },
      orderBy: { date: "desc" },
    });

    return res.status(200).json({
      success: true,
      total: pendencias.length,
      list: pendencias.map((p) => ({
        id: p.id,
        kitSize: p.kitSize,
        date: p.date,
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar pendências:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

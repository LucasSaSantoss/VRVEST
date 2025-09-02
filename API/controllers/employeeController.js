// controllers/userController.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createEmpl = async (req, res) => {
  try {
    const {
      name,
      cpf,
      email,
      sector,
      position,
      userID, // vindo do front
      userName, // vindo do front
      modality,
    } = req.body;

    // Verifica se email já existe
    const existingEmpl = await prisma.employee.findUnique({ where: { email } });
    if (existingEmpl) {
      return res.status(400).json({ message: "Email já registrado" });
    }

    // Cria o funcionário vinculado ao usuário logado
    const newEmpl = await prisma.employee.create({
      data: {
        name,
        cpf,
        email,
        sector,
        position,
        cadUserID: Number(userID),
        cadUserName: userName,
        modality,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Funcionário criado", id: newEmpl.id });
  } catch (err) {
    console.error("Erro ao criar Funcionário:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};


export const getEmpl = async (req, res) => {
  try {
    const empl = await prisma.employee.findMany();
    res.status(200).json(empl);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    res.status(500).json({ success: false, message: "Erro ao listar funcionários" });
  }
};

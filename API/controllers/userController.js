// controllers/userController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();


export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: "Email ou senha inválidos" });
    }
    
    // Gerar JWT
    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        email: user.email,
        sector: user.sector,
        position: user.position,
        level: user.level,
      },
      process.env.JWT_SECRET || "segredo_supersecreto", 
      { expiresIn: "4h" } // expira em 4 horas
    );

    return res.status(200).json({
      success: true,
      message: "Login bem-sucedido",
      token, 
    });
  } catch (err) {
    console.error("Erro no login:", err);
    return res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};


export const createUser = async (req, res) => {
  const { name, email, password, sector, position, level } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email já registrado" });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        sector,
        position,
        level: parseInt(level, 10),
      },
    });

    res.status(201).json({ message: "Usuário criado", id: newUser.id });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    return res
      .status(500)

      .json({ success: false, message: "Erro no servidor" });
  }
};



export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};


export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, sector, position, Level, active } = req.body;

    // Verifica se o funcionário existe
    const usuario = await prisma.user.findUnique({
      where: { id: Number(id) },
    });

    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Funcionário não encontrado" });
    }

    // Verifica se o email já está em uso por outro funcionário
    if (email) {
      const emailExistente = await prisma.user.findUnique({
        where: { email },
      });
      if (emailExistente && emailExistente.id !== Number(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Email já está em uso" });
      }
    }

    // Verifica se o CPF já está em uso por outro funcionário
    if (cpf) {
      const cpfExistente = await prisma.employee.findUnique({ where: { cpf } });
      if (cpfExistente && cpfExistente.id !== Number(id)) {
        return res
          .status(400)
          .json({ success: false, message: "CPF já está em uso" });
      }
    }

    // Atualiza
    const updatedEmpl = await prisma.employee.update({
      where: { id: Number(id) },
      data: {
        name,
        cpf,
        email,
        sector,
        position,
        modality,
        active: Number(active),
      },
    });
    res.json({
      success: true,
      message: "Funcionário atualizado com sucesso",
      funcionario: updatedEmpl,
    });
  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

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
      { expiresIn: "2h" } // expira em 2 horas
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

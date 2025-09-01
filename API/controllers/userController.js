// controllers/userController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

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
        level,
      },
    });

    res.status(201).json({ message: "Usuário criado", id: newUser.id });
  } catch (err) {
    res.status(500).json({ message: "Erro ao criar o usuário" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ message: "Email ou senha inválidos" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      "your-secret-key",
      { expiresIn: "1h" }
    );

    res.json({ message: "Login bem-sucedido", token });
  } catch (err) {
    res.status(500).json({ message: "Erro ao autenticar" });
  }
};

export const getUsers = async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
};

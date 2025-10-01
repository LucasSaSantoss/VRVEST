// controllers/userController.js
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import { differenceInHours } from "date-fns";

const prisma = new PrismaClient();

export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou senha inválidos" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res
        .status(401)
        .json({ success: false, message: "Email ou senha inválidos" });
    }

    if (user.active !== 1) {
      return res
        .status(401)
        .json({ success: false, message: "Usuário Inativo." });
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
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

export const createUser = async (req, res) => {
  const { name, email, password, sector, position, level } = req.body;

  if (!validator.isEmail(email)) {
    return res.status(400).json({ message: "Email inválido." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email já registrado" });
    }
    const cadUserID = req.user.id;
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

    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // ---------------- LOGS ----------------
    await prisma.userLog.create({
      data: {
        userId: cadUserID, // ID do usuário que fez a criação
        action: "Criação de Usuário", // ação
        newData: {
          name: newUser.name,
          email: newUser.email,
          sector: newUser.sector,
          position: newUser.position,
          level: newUser.level,
        },
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

    res.status(201).json({ message: "Usuário criado", id: newUser.id });
  } catch (err) {
    console.error("Erro ao criar usuário:", err);
    return res
      .status(500)

      .json({ success: false, message: "Erro no servidor" });
  }
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        level: {
          not: 4,
        },
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, sector, position, level, active } = req.body;

    // Busca usuário existente
    const usuario = await prisma.user.findUnique({ where: { id: Number(id) } });
    if (!usuario) {
      return res
        .status(404)
        .json({ success: false, message: "Usuário não encontrado" });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({ message: "Email inválido." });
    }

    // Construção de campos a serem alterados (apenas se diferentes)
    const camposAlterados = {};

    if (name !== undefined && name !== usuario.name)
      camposAlterados.name = name;
    if (email !== undefined && email !== usuario.email)
      camposAlterados.email = email;
    if (sector !== undefined && sector !== usuario.sector)
      camposAlterados.sector = sector;
    if (position !== undefined && position !== usuario.position)
      camposAlterados.position = position;
    if (
      level !== undefined &&
      level !== null &&
      level !== "" &&
      Number(level) !== usuario.level
    ) {
      camposAlterados.level = Number(level);
    }

    if (
      active !== undefined &&
      active !== null &&
      active !== "" &&
      Number(active) !== usuario.active
    ) {
      camposAlterados.active = Number(active);
    }

    // Senha só se enviada e diferente
    if (password && password !== usuario.password) {
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      camposAlterados.password = hashedPassword;
    }

    // Se email mudou, verificar duplicidade
    if (camposAlterados.email) {
      const emailExistente = await prisma.user.findUnique({ where: { email } });
      if (emailExistente && emailExistente.id !== Number(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Email já está em uso" });
      }
    }

    // Nenhuma alteração detectada
    if (Object.keys(camposAlterados).length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum campo foi alterado" });
    }

    // Atualiza apenas os campos modificados
    const updatedUser = await prisma.user.update({
      where: { id: Number(id) },
      data: camposAlterados,
    });

    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // ---------------- LOGS ----------------
    const logChanges = Object.keys(camposAlterados).reduce((acc, key) => {
      acc[key] = { old: usuario[key], new: updatedUser[key] };
      return acc;
    }, {});

    await prisma.userLog.create({
      data: {
        userId: usuario.id, // ID do usuário que fez a alteração
        action: "Alteração de usuário",
        changes: logChanges, // JSON criado para apresentar os campos alterados
        newData: updatedUser, // todo o objeto atualizado (ou pode ser só campos alterados)
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

    return res.json({
      success: true,
      message: "Usuário atualizado com sucesso",
      usuario: updatedUser,
    });
  } catch (err) {
    console.error("Erro ao atualizar Usuário:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

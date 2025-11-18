import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const registerLog = async (req, res) => {
  try {
    const { userId, action, changes, createdAt } = req.body;

    const log = await prisma.userLog.create({
      data: {
        userId: userId,
        action: action,
        newData: changes,
        createdAt: new Date(createdAt),
      },
    });
    return res.json({
      success: true,
      log,
    });
  } catch (error) {
    console.error("❌ ERRO AO REGISTRAR LOG:", error);
    res.status(500).json({ error: "Erro ao registrar log" });
  }
};
  
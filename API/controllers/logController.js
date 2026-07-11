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

export const getLogs = async (req, res) => {
  try {
    const logs =
      await prisma.$queryRaw`select  user.name,user.id,action,changes, action,newData, createdAt, userLog.id as userLog from userLog
inner join user on userlog.userId = user.id;`;
    return res.json(logs);
  } catch (error) {
    console.error("❌ ERRO AO OBTER LOGS:", error);
    res.status(500).json({ error: "Erro ao obter logs" });
  }
};

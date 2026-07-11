import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLogs = async (req, res) => {
  try {
    const logs =
      await prisma.$queryRaw`select  user.name,user.id,action,changes, action,newData, createdAt, userLog.id as logId from userLog
inner join user on userlog.userId = user.id; `;
    res.json(logs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar logs." });
  }
};

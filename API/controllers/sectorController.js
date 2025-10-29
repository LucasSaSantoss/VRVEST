import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSectors = async (req, res) => {
  try {
    const sector = await prisma.sectors.findMany();
    res.json(sector);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar setores" });
  }
};

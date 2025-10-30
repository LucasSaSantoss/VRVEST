import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getModalities = async (req, res) => {
  try {
    const modality = await prisma.modalities.findMany();
    res.json(modality);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar Modalidades" });
  }
};

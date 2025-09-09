import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getEmpl = async (req, res) => {
  try {
    const empl = await prisma.pendency.findMany();
    res.status(200).json(empl);
  } catch (err) {
    console.error("Erro ao buscar pendências:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao listar pendências" });
  }
};

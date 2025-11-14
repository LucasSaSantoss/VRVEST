import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getSpecialties = async (req, res) => {
  try {
    const specialty = await prisma.Specialties.findMany();
    res.json(specialty);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar especialidades." });
  }
};

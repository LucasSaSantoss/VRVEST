import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Buscar todos os registros
export const getRegistros = async (req, res) => {
  try {
    const registros = await prisma.pendency.findMany({
      orderBy: { date: "desc" }, // opcional, ordena pela data mais recente
    });

    return res.json({
      success: true,
      message: "Registros carregados com sucesso",
      data: registros,
    });
  } catch (err) {
    console.error("Erro ao buscar registros:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

export const baixarPendencias = async (req, res) => {
  try {
    const { ids } = req.body; // array com os ids selecionados

    await prisma.pendency.updateMany({
      where: {
        id: { in: ids },
      },
      data: {
        status: 2, // marcar como baixado
      },
    });

    return res.json({
      success: true,
      message: "Pendências baixadas com sucesso",
    });
  } catch (err) {
    console.error("Erro ao baixar pendências:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

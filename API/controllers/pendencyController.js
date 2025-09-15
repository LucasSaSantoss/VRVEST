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
    const { ids } = req.body;
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum ID enviado" });
    }

    const numericIds = ids.map((i) => Number(i));

    await prisma.pendency.updateMany({
      where: { id: { in: numericIds } },
      data: { status: 2,
        devolUserId: usuarioID,
        devolUserName: usuarioName,
        devolDate: new Date(),
        devolType: 3,
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





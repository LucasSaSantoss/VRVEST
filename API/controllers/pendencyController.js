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
    const { id } = req.body;
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;

    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Nenhum ID enviado" });
    }

    // Atualiza apenas a pendência correspondente
    const pendenciaAtualizada = await prisma.pendency.update({
      where: { id: Number(id) },
      data: {
        status: 2, //Baixado;
        devolUserId: usuarioID,
        devolUserName: usuarioName,
        devolDate: new Date(),
        devolType: 3, //Devolvido por meio da tela de baixa financeira;
      },
    });

    return res.json({
      success: true,
      updatedPendencias: [pendenciaAtualizada],
      message: "Pendência baixada com sucesso",
    });
  } catch (err) {
    console.error("Erro ao baixar pendência:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

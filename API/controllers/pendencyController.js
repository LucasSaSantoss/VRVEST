import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";

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

    const oldPend = await prisma.pendency.findUnique({ where: { id } });

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
      include: {
        employee: true, // Inclui os dados do funcionário relacionado
      },
    });

    const funcionario = pendenciaAtualizada.employee;

    // ---------------- LOG ----------------

    await prisma.userLog.create({
      data: {
        userId: usuarioID,
        action: "Baixa de Pendência",
        newData: pendenciaAtualizada,
        createdAt: new Date(),
      },
    });
    // --------------------------------------

    // Envia e-mail automaticamente
    await enviarEmail(
      funcionario.email,
      "Devolução de Kit",
      `Olá ${pendenciaAtualizada.emplName}, seu kit foi devolvido em ${new Date(
        pendenciaAtualizada.devolDate
      ).toLocaleString(
        "pt-BR"
      )} pelo usuário ${usuarioName}, através da baixa de pendências.`
    );

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

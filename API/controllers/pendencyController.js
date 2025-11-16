import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";

const prisma = new PrismaClient();

const emailCopiado = process.env.EMAIL_COPIADO;

// Buscar todos os registros
// controllers/pendencyController.js
export const getRegistros = async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    let filtroData = {};

    if (inicio && fim) {
      filtroData = {
        date: {
          gte: new Date(inicio),
          lte: new Date(fim),
        },
      };
    } else {
      const hoje = new Date();
      const inicioAnoPassado = new Date(hoje.getFullYear() - 1, 0, 1);
      const fimDia = new Date(hoje.setHours(23, 59, 59, 999));
      filtroData = {
        date: { gte: inicioAnoPassado, lte: fimDia },
      };
    }

    const registros = await prisma.pendency.findMany({
      where: filtroData,
      orderBy: { date: "desc" },
      include: {
        employee: {
          select: { cpf: true, name: true, sector: true, matricula: true },
        },
      },
    });
    return res.json({
      success: true,
      message: "Registros carregados com sucesso",
      data: registros,
    });
  } catch (err) {
    console.error("Erro ao buscar registros:", err);
    return res.status(500).json({
      success: false,
      message: "Erro no servidor",
    });
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
    const usuario = await prisma.user.findUnique({
      where: { id: usuarioID },
    });
    s;
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
    const limiteVenc = new Date();
    limiteVenc.setHours(limiteVenc.getHours() + 36);

    if (usuario.level >= 4) {
      await enviarEmail(
        funcionario.email,
        "Baixa Financeira de Pendência",
        `Olá ${pendenciaAtualizada.emplName},

        Informamos que foi realizada a baixa financeira referente a uma pendência vinculada ao seu nome. 
        O procedimento registrou o valor de R$ ${oldPend.kitPrice || "0,00"} na data ${new Date(
          pendenciaAtualizada.devolDate
        ).toLocaleString("pt-BR")}.

      \n\nCaso tenha alguma dúvida, estamos à disposição.`,
        emailCopiado
      );
    }

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

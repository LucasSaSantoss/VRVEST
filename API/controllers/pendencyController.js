import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";

const prisma = new PrismaClient();

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
          select: { cpf: true, name: true, sector: true },
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

    const dataParaDevol = limiteVenc.toLocaleString("pt-BR");
    await enviarEmail(
      funcionario.email,
      "Devolução de Kit",
      `Olá ${pendenciaAtualizada.emplName}, seu kit foi devolvido com sucesso em ${new Date(
        pendenciaAtualizada.devolDate
      ).toLocaleString(
        "pt-BR"
      )}, através da baixa de pendências.`
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

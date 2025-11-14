import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getItemsPrices = async (req, res) => {
  try {
    const itemsPrices = await prisma.itemsCloth.findMany();
    res.json(itemsPrices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar Modalidades" });
  }
};

export const changePrices = async (req, res) => {
  try {
    const { idUser, pijamaValue } = req.body;

    // Validação básica de entrada
    if (!idUser) {
      return res.status(400).json({
        success: false,
        message: "ID do usuário não informado.",
      });
    }

    if (pijamaValue === undefined || pijamaValue === null) {
      return res.status(400).json({
        success: false,
        message: "Valor do pijama não informado.",
      });
    }

    // Verifica se o usuário existe
    const usuario = await prisma.user.findUnique({
      where: { id: Number(idUser) },
      select: { id: true, name: true },
    });

    if (!usuario) {
      return res.status(404).json({
        success: false,
        message: "Usuário não encontrado.",
      });
    }

    // Atualiza apenas se o valor mudou
    const itemAtual = await prisma.itemsCloth.findUnique({ where: { id: 1 } });
    if (!itemAtual) {
      return res.status(404).json({
        success: false,
        message: "Item não encontrado.",
      });
    }

    if (itemAtual.itemVal === pijamaValue) {
      return res.status(200).json({
        success: false,
        message: "O valor informado é igual ao atual. Nenhuma alteração feita.",
      });
    }

    const updatedPrices = await prisma.itemsCloth.update({
      where: { id: 1 },
      data: { itemVal: pijamaValue },
    });

    // Usa data formatada (sem subtrair manualmente 3h)
    const now = new Date();
    const createdAt = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Sao_Paulo" })
    );

    //  Cria log com dados relevantes
    await prisma.userLog.create({
      data: {
        userId: usuario.id,
        action: "Alteração de preço do item",
        changes: {
          campo: "itemVal",
          de: itemAtual.itemVal,
          para: pijamaValue,
        },
        createdAt,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Preço alterado com sucesso.",
      prices: updatedPrices,
    });
  } catch (err) {
    console.error("Erro ao atualizar preço:", err);
    return res.status(500).json({
      success: false,
      message: "Erro interno ao atualizar o preço.",
      error: err.message,
    });
  }
};

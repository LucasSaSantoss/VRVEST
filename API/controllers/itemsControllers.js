import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const ADMIN_LEVEL = 4;

const requireAdmin = (req, res) => {
  if (Number(req.user?.level) < ADMIN_LEVEL) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas administrador.",
    });
    return false;
  }
  return true;
};

export const getItemsPrices = async (req, res) => {
  try {
    const itemsPrices = await prisma.itemsCloth.findMany();
    res.json(itemsPrices);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar Modalidades" });
  }
};

export const listUniformItems = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const data = await prisma.itemsCloth.findMany({
      where: { isUniform: 1 },
      orderBy: { itemName: "asc" },
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar uniformes:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro ao listar uniformes.",
    });
  }
};

export const createUniformItem = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { itemName, itemVal, minStock, active } = req.body;
    if (!itemName || !String(itemName).trim()) {
      return res.status(400).json({
        success: false,
        message: "Nome do uniforme é obrigatório.",
      });
    }
    if (itemVal === undefined || itemVal === null || String(itemVal).trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Valor do uniforme é obrigatório.",
      });
    }

    const created = await prisma.itemsCloth.create({
      data: {
        itemName: String(itemName).trim(),
        itemVal: String(itemVal).trim(),
        minStock: Number(minStock || 0),
        isUniform: 1,
        active: active !== undefined ? Number(active) : 1,
      },
    });

    await prisma.userLog.create({
      data: {
        userId: Number(req.user?.id) || null,
        action: "UNIFORM_ITEM_CREATE",
        newData: created,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("Erro ao cadastrar uniforme:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro ao cadastrar uniforme.",
    });
  }
};

export const updateUniformItem = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const id = Number(req.params.id);
    const { itemName, itemVal, minStock, active } = req.body;
    const current = await prisma.itemsCloth.findUnique({ where: { id } });
    if (!current || current.isUniform !== 1) {
      return res.status(404).json({
        success: false,
        message: "Uniforme não encontrado.",
      });
    }

    const updated = await prisma.itemsCloth.update({
      where: { id },
      data: {
        itemName:
          itemName !== undefined ? String(itemName).trim() : current.itemName,
        itemVal: itemVal !== undefined ? String(itemVal).trim() : current.itemVal,
        minStock: minStock !== undefined ? Number(minStock) : current.minStock,
        active: active !== undefined ? Number(active) : current.active,
        isUniform: 1,
      },
    });

    await prisma.userLog.create({
      data: {
        userId: Number(req.user?.id) || null,
        action: "UNIFORM_ITEM_UPDATE",
        changes: {
          before: current,
          after: updated,
        },
      },
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    console.error("Erro ao atualizar uniforme:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro ao atualizar uniforme.",
    });
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

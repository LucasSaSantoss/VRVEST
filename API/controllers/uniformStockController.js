import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const parseQty = (value) => Number(value || 0);
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const getStockSizeOrFail = async (stockSizeId) => {
  const stockSize = await prisma.uniformStockSize.findUnique({
    where: { id: Number(stockSizeId) },
  });
  return stockSize;
};

const writeUserLog = async (tx, userId, action, payload) => {
  await tx.userLog.create({
    data: {
      userId: Number(userId) || null,
      action,
      changes: payload,
      newData: payload,
    },
  });
};

const applyMovementEffect = (stockSize, movement) => {
  const qty = Number(movement.quantity || 0);
  let mainDelta = 0;
  let loanDelta = 0;

  if (movement.movementType === "ENTRY") {
    if (movement.notes?.includes("empr")) {
      loanDelta = qty;
    } else {
      mainDelta = qty;
    }
  } else if (movement.movementType === "DISCARD") {
    if (movement.notes?.includes("(LOAN)")) {
      loanDelta = -qty;
    } else {
      mainDelta = -qty;
    }
  } else if (movement.movementType === "ADJUSTMENT") {
    const mainMatch = movement.notes?.match(/MainDelta=(-?\d+)/i);
    const loanMatch = movement.notes?.match(/LoanDelta=(-?\d+)/i);
    if (mainMatch || loanMatch) {
      mainDelta = mainMatch ? Number(mainMatch[1]) : 0;
      loanDelta = loanMatch ? Number(loanMatch[1]) : 0;
    } else if (movement.notes?.includes("principal -> empr")) {
      mainDelta = -qty;
      loanDelta = qty;
    }
  }

  const finalMain = stockSize.qtyMainStock + mainDelta;
  const finalLoan = stockSize.qtyLoanStock + loanDelta;
  return { mainDelta, loanDelta, finalMain, finalLoan };
};

export const createStockSize = async (req, res) => {
  try {
    const { itemId, size, qtyMainStock, qtyLoanStock, minStock } = req.body;
    if (!itemId || !size) {
      return res.status(400).json({
        success: false,
        message: "itemId e size são obrigatórios.",
      });
    }

    const item = await prisma.itemsCloth.findUnique({ where: { id: Number(itemId) } });
    if (!item) {
      return res.status(404).json({ success: false, message: "Item não encontrado." });
    }

    const created = await prisma.uniformStockSize.create({
      data: {
        itemId: Number(itemId),
        size: String(size).trim().toUpperCase(),
        qtyMainStock: parseQty(qtyMainStock),
        qtyLoanStock: parseQty(qtyLoanStock),
        minStock: parseQty(minStock),
      },
    });

    await prisma.userLog.create({
      data: {
        userId: Number(req.user?.id) || null,
        action: "UNIFORM_STOCK_SIZE_CREATE",
        changes: { itemId: Number(itemId), size: String(size).trim().toUpperCase() },
        newData: created,
      },
    });

    return res.status(201).json({ success: true, data: created });
  } catch (error) {
    console.error("Erro ao criar variação de estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const stockEntry = async (req, res) => {
  try {
    const { uniformStockSizeId, quantity, notes } = req.body;
    const qty = parseQty(quantity);
    if (!uniformStockSizeId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "uniformStockSizeId e quantity>0 são obrigatórios.",
      });
    }

    const stockSize = await getStockSizeOrFail(uniformStockSizeId);
    if (!stockSize) {
      return res.status(404).json({ success: false, message: "Registro de estoque não encontrado." });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data: { qtyMainStock: { increment: qty } },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "ENTRY",
          originType: "MANUAL_ENTRY",
          quantity: qty,
          userId,
          notes: notes || "Entrada no estoque principal.",
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_ENTRY_MAIN", {
        uniformStockSizeId: Number(uniformStockSizeId),
        quantity: qty,
        notes: notes || "Entrada no estoque principal.",
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao registrar entrada de estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const loanStockEntry = async (req, res) => {
  try {
    const { uniformStockSizeId, quantity, notes } = req.body;
    const qty = parseQty(quantity);
    if (!uniformStockSizeId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "uniformStockSizeId e quantity>0 são obrigatórios.",
      });
    }

    const stockSize = await getStockSizeOrFail(uniformStockSizeId);
    if (!stockSize) {
      return res.status(404).json({ success: false, message: "Registro de estoque não encontrado." });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data: { qtyLoanStock: { increment: qty } },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "ENTRY",
          originType: "MANUAL_ENTRY",
          quantity: qty,
          userId,
          notes: notes || "Entrada no estoque de empréstimos.",
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_ENTRY_LOAN", {
        uniformStockSizeId: Number(uniformStockSizeId),
        quantity: qty,
        notes: notes || "Entrada no estoque de emprestimos.",
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao registrar entrada no estoque de empréstimos:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const discardStock = async (req, res) => {
  try {
    const { uniformStockSizeId, quantity, source, notes } = req.body;
    const qty = parseQty(quantity);
    const sourceNormalized = (source || "").trim().toUpperCase();

    if (!uniformStockSizeId || qty <= 0 || !["MAIN", "LOAN"].includes(sourceNormalized)) {
      return res.status(400).json({
        success: false,
        message: "Informe uniformStockSizeId, quantity>0 e source MAIN/LOAN.",
      });
    }

    if (!notes || !String(notes).trim()) {
      return res.status(400).json({
        success: false,
        message: "Motivo do descarte é obrigatório.",
      });
    }

    const stockSize = await getStockSizeOrFail(uniformStockSizeId);
    if (!stockSize) {
      return res.status(404).json({ success: false, message: "Registro de estoque não encontrado." });
    }

    const available = sourceNormalized === "MAIN" ? stockSize.qtyMainStock : stockSize.qtyLoanStock;
    if (available < qty) {
      return res.status(400).json({ success: false, message: "Saldo insuficiente para descarte." });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data:
          sourceNormalized === "MAIN"
            ? { qtyMainStock: { decrement: qty } }
            : { qtyLoanStock: { decrement: qty } },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "DISCARD",
          originType: "MANUAL_ADJUSTMENT",
          quantity: qty,
          userId,
          notes: `Descarte (${sourceNormalized}): ${notes}`,
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_DISCARD", {
        uniformStockSizeId: Number(uniformStockSizeId),
        source: sourceNormalized,
        quantity: qty,
        notes: String(notes).trim(),
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao descartar estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const adjustStock = async (req, res) => {
  try {
    const { uniformStockSizeId, quantityDeltaMain, quantityDeltaLoan, notes } = req.body;
    const mainDelta = Number(quantityDeltaMain || 0);
    const loanDelta = Number(quantityDeltaLoan || 0);
    if (!uniformStockSizeId || (mainDelta === 0 && loanDelta === 0)) {
      return res.status(400).json({
        success: false,
        message: "Informe uniformStockSizeId e ao menos um delta diferente de zero.",
      });
    }
    if (!notes || !String(notes).trim()) {
      return res.status(400).json({ success: false, message: "Motivo do ajuste é obrigatório." });
    }

    const stockSize = await getStockSizeOrFail(uniformStockSizeId);
    if (!stockSize) {
      return res.status(404).json({ success: false, message: "Registro de estoque não encontrado." });
    }

    const finalMain = stockSize.qtyMainStock + mainDelta;
    const finalLoan = stockSize.qtyLoanStock + loanDelta;
    if (finalMain < 0 || finalLoan < 0) {
      return res.status(400).json({
        success: false,
        message: "Ajuste inválido: saldo não pode ficar negativo.",
      });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data: {
          qtyMainStock: finalMain,
          qtyLoanStock: finalLoan,
        },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "ADJUSTMENT",
          originType: "MANUAL_ADJUSTMENT",
          quantity: Math.abs(mainDelta) + Math.abs(loanDelta),
          userId,
          notes: `Ajuste manual. MainDelta=${mainDelta}, LoanDelta=${loanDelta}. ${notes}`,
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_ADJUSTMENT", {
        uniformStockSizeId: Number(uniformStockSizeId),
        quantityDeltaMain: mainDelta,
        quantityDeltaLoan: loanDelta,
        notes: String(notes).trim(),
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao ajustar estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const listStockSizes = async (_req, res) => {
  try {
    const data = await prisma.uniformStockSize.findMany({
      orderBy: [{ itemId: "asc" }, { size: "asc" }],
      include: { item: true },
    });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar estoque por tamanho:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const transferMainToLoan = async (req, res) => {
  try {
    const { uniformStockSizeId, quantity, notes } = req.body;
    const qty = parseQty(quantity);

    if (!uniformStockSizeId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Informe uniformStockSizeId e quantity>0.",
      });
    }
    if (!notes || !String(notes).trim()) {
      return res.status(400).json({
        success: false,
        message: "Justificativa da transferência é obrigatória.",
      });
    }

    const stockSize = await getStockSizeOrFail(uniformStockSizeId);
    if (!stockSize) {
      return res.status(404).json({
        success: false,
        message: "Registro de estoque não encontrado.",
      });
    }
    if (stockSize.qtyMainStock < qty) {
      return res.status(400).json({
        success: false,
        message: "Saldo insuficiente no estoque principal para transferência.",
      });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data: {
          qtyMainStock: { decrement: qty },
          qtyLoanStock: { increment: qty },
        },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "ADJUSTMENT",
          originType: "MANUAL_ADJUSTMENT",
          quantity: qty,
          userId,
          notes: `Transferência principal -> empréstimos. ${notes}`,
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_TRANSFER_MAIN_TO_LOAN", {
        uniformStockSizeId: Number(uniformStockSizeId),
        quantity: qty,
        notes: String(notes).trim(),
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao transferir estoque principal para empréstimos:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const listMovements = async (req, res) => {
  try {
    const { uniformStockSizeId, limit = 100 } = req.query;
    const where = {};
    if (uniformStockSizeId) {
      where.uniformStockSizeId = Number(uniformStockSizeId);
    }

    const data = await prisma.uniformMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: Math.min(Number(limit) || 100, 500),
      include: {
        user: { select: { id: true, name: true, email: true } },
        uniformStockSize: {
          include: { item: true },
        },
      },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar movimentações de estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const reverseMovement = async (req, res) => {
  try {
    const movementId = Number(req.params.id);
    const { reason } = req.body;

    if (!movementId || Number.isNaN(movementId)) {
      return res.status(400).json({ success: false, message: "ID da movimentacao invalido." });
    }
    if (!reason || !String(reason).trim()) {
      return res.status(400).json({
        success: false,
        message: "Justificativa obrigatoria para desfazer movimentacao.",
      });
    }

    const movement = await prisma.uniformMovement.findUnique({
      where: { id: movementId },
      include: { uniformStockSize: true },
    });
    if (!movement) {
      return res.status(404).json({ success: false, message: "Movimentacao nao encontrada." });
    }

    if (movement.movementType === "REVERSAL") {
      return res.status(400).json({
        success: false,
        message: "Nao e permitido desfazer uma movimentacao de reversao.",
      });
    }

    const startOfYesterday = new Date();
    startOfYesterday.setHours(0, 0, 0, 0);
    startOfYesterday.setTime(startOfYesterday.getTime() - ONE_DAY_MS);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    if (movement.createdAt < startOfYesterday || movement.createdAt > endOfToday) {
      return res.status(400).json({
        success: false,
        message: "So e permitido desfazer movimentacoes de hoje e de ontem.",
      });
    }

    const alreadyReversed = await prisma.uniformMovement.findFirst({
      where: {
        referenceType: "UNIFORM_MOVEMENT_REVERSAL",
        referenceId: movement.id,
      },
    });
    if (alreadyReversed) {
      return res.status(400).json({
        success: false,
        message: "Esta movimentacao ja foi desfeita anteriormente.",
      });
    }

    const effect = applyMovementEffect(movement.uniformStockSize, movement);
    if (effect.mainDelta === 0 && effect.loanDelta === 0) {
      return res.status(400).json({
        success: false,
        message: "Movimentacao sem efeito conhecido para desfazer automaticamente.",
      });
    }

    const revertMain = -effect.mainDelta;
    const revertLoan = -effect.loanDelta;
    const finalMain = movement.uniformStockSize.qtyMainStock + revertMain;
    const finalLoan = movement.uniformStockSize.qtyLoanStock + revertLoan;

    if (finalMain < 0 || finalLoan < 0) {
      return res.status(400).json({
        success: false,
        message: "Nao e possivel desfazer: saldo ficaria negativo.",
      });
    }

    const userId = req.user.id;
    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformStockSize.update({
        where: { id: movement.uniformStockSizeId },
        data: {
          qtyMainStock: finalMain,
          qtyLoanStock: finalLoan,
        },
      });

      const reverseNotes = `Reversao da movimentacao #${movement.id}. Motivo: ${String(reason).trim()}`;
      const reverseQuantity = Math.abs(revertMain) + Math.abs(revertLoan);
      const reverseMovementCreated = await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: movement.uniformStockSizeId,
          movementType: "REVERSAL",
          originType: "MANUAL_ADJUSTMENT",
          referenceType: "UNIFORM_MOVEMENT_REVERSAL",
          referenceId: movement.id,
          quantity: reverseQuantity,
          userId,
          notes: `${reverseNotes}. MainDelta=${revertMain}, LoanDelta=${revertLoan}.`,
        },
      });

      await writeUserLog(tx, userId, "UNIFORM_STOCK_REVERSE_MOVEMENT", {
        reversedMovementId: movement.id,
        reverseMovementId: reverseMovementCreated.id,
        reason: String(reason).trim(),
        mainDelta: revertMain,
        loanDelta: revertLoan,
      });

      return updated;
    });

    return res.json({ success: true, data: result });
  } catch (error) {
    console.error("Erro ao desfazer movimentacao de estoque:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

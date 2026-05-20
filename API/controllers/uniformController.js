import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EMPLOYEE_SAFE_SELECT = {
  id: true,
  name: true,
  cpf: true,
  email: true,
  sector: true,
  position: true,
  modality: true,
  active: true,
};

const isOperatorOrAdmin = (level) => Number(level) >= 3;
const isDpOrAdmin = (level) => Number(level) >= 2;

const requireOperatorOrAdmin = (req, res) => {
  if (!isOperatorOrAdmin(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas operador ou administrador.",
    });
    return false;
  }
  return true;
};

const requireDpOrAdmin = (req, res) => {
  if (!isDpOrAdmin(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas DP ou administrador.",
    });
    return false;
  }
  return true;
};

const getOrCreateUniformSetting = async (tx = prisma) => {
  const existing = await tx.uniformSetting.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return tx.uniformSetting.create({
    data: { annualLimit: 2 },
  });
};

const getItemUnitValue = (itemVal) => {
  if (itemVal === null || itemVal === undefined) return 0;
  const normalized = String(itemVal).replace(".", "").replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPendingQuantity = (withdrawalItem) =>
  Number(withdrawalItem.quantity || 0) -
  Number(withdrawalItem.returnedQuantity || 0) -
  Number(withdrawalItem.discountedQuantity || 0);

export const getUniformSettings = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const settings = await getOrCreateUniformSetting();
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Erro ao carregar configuração de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const updateUniformAnnualLimit = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const annualLimit = Number(req.body?.annualLimit);
    if (!Number.isInteger(annualLimit) || annualLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: "Limite anual deve ser um número inteiro maior que zero.",
      });
    }

    const userId = req.user?.id ? Number(req.user.id) : null;
    const updated = await prisma.$transaction(async (tx) => {
      const settings = await getOrCreateUniformSetting(tx);
      const result = await tx.uniformSetting.update({
        where: { id: settings.id },
        data: {
          annualLimit,
          updatedByUserId: userId,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_UPDATE_ANNUAL_LIMIT",
          changes: { annualLimit },
          newData: { uniformSettingId: result.id, annualLimit: result.annualLimit },
        },
      });

      return result;
    });

    return res.json({
      success: true,
      message: "Limite anual atualizado com sucesso.",
      data: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar limite anual de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const getEmployeeUniformSummary = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const { cpf } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();

    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const settings = await getOrCreateUniformSetting();
    const limitApplied = Number(settings.annualLimit || 2);

    const withdrawnInYear = await prisma.uniformWithdrawal.count({
      where: { employeeId: employee.id, year },
    });
    const remaining = Math.max(limitApplied - withdrawnInYear, 0);

    const openWithdrawals = await prisma.uniformWithdrawal.findMany({
      where: {
        employeeId: employee.id,
        status: { in: ["REGULAR", "EXEMPT", "CHARGEABLE", "PARTIAL_RETURN"] },
      },
      orderBy: { withdrawDate: "desc" },
      include: {
        items: {
          include: {
            uniformStockSize: {
              include: { item: true },
            },
          },
        },
      },
    });

    const openWithdrawalsNormalized = openWithdrawals
      .map((w) => {
        const items = w.items.map((i) => {
          const pendingQuantity = Math.max(getPendingQuantity(i), 0);
          return {
            ...i,
            pendingQuantity,
          };
        });
        const pendingTotal = items.reduce((acc, i) => acc + i.pendingQuantity, 0);
        return { ...w, items, pendingTotal };
      })
      .filter((w) => w.pendingTotal > 0);

    return res.json({
      success: true,
      data: {
        employee,
        year,
        limitApplied,
        withdrawnInYear,
        remaining,
        openWithdrawals: openWithdrawalsNormalized,
        lastWithdrawal: openWithdrawals[0] || null,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resumo de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const createUniformWithdrawal = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const { cpf, items, nonDeliveryJustification, notes } = req.body;

    if (!cpf || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CPF e lista de itens são obrigatórios.",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });

    if (!employee || employee.active !== 1) {
      return res.status(400).json({
        success: false,
        message: "Colaborador inválido ou inativo.",
      });
    }

    const settings = await getOrCreateUniformSetting();
    const limitApplied = Number(settings.annualLimit || 2);

    const year = new Date().getFullYear();
    const now = new Date();

    const totalQuantity = items.length;
    if (totalQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "A retirada deve conter ao menos um uniforme.",
      });
    }

    const withdrawnInYear = await prisma.uniformWithdrawal.count({
      where: { employeeId: employee.id, year },
    });
    const willExceedLimit = withdrawnInYear + 1 > limitApplied;

    let status = "REGULAR";
    let chargeReason = null;
    if (willExceedLimit) {
      if (nonDeliveryJustification && nonDeliveryJustification.trim()) {
        status = "EXEMPT";
      } else {
        status = "CHARGEABLE";
        chargeReason = "Retirada acima do limite anual sem justificativa.";
      }
    }

    const userId = req.user.id;

    const stockIds = items.map((item) => Number(item.uniformStockSizeId));
    const stockRecords = await prisma.uniformStockSize.findMany({ where: { id: { in: stockIds } } });
    const stockMap = new Map(stockRecords.map((s) => [s.id, s]));

    for (const item of items) {
      const stockId = Number(item.uniformStockSizeId);
      const quantity = 1;
      const stock = stockMap.get(stockId);
      if (!stock || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Item de estoque inválido na retirada." });
      }
      if (stock.qtyMainStock < quantity) {
        return res.status(400).json({ success: false, message: `Saldo insuficiente para item ${stockId}.` });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.uniformWithdrawal.create({
        data: {
          employeeId: employee.id,
          userId,
          year,
          withdrawDate: now,
          totalQuantity,
          limitApplied,
          status,
          nonDeliveryJustification: nonDeliveryJustification || null,
          chargeReason,
          notes: notes || null,
        },
      });

      for (const item of items) {
        const stockId = Number(item.uniformStockSizeId);
        const quantity = 1;

        await tx.uniformWithdrawalItem.create({
          data: {
            uniformWithdrawalId: withdrawal.id,
            uniformStockSizeId: stockId,
            quantity,
          },
        });

        await tx.uniformStockSize.update({
          where: { id: stockId },
          data: { qtyMainStock: { decrement: quantity } },
        });

        await tx.uniformMovement.create({
          data: {
            uniformStockSizeId: stockId,
            movementType: "EXIT",
            originType: "WITHDRAWAL",
            referenceType: "UniformWithdrawal",
            referenceId: withdrawal.id,
            quantity,
            userId,
            notes: "Retirada de uniforme.",
          },
        });
      }

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_WITHDRAWAL_CREATE",
          newData: {
            employeeId: employee.id,
            uniformWithdrawalId: withdrawal.id,
            totalQuantity,
            status,
            limitApplied,
          },
          createdAt: now,
        },
      });

      return withdrawal;
    });

    return res.status(201).json({
      success: true,
      message: "Retirada registrada com sucesso.",
      data: result,
    });
  } catch (error) {
    console.error("Erro ao registrar retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const returnUniformWithdrawalItems = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const withdrawalId = Number(req.params.id);
    const { items, notes } = req.body;

    if (!withdrawalId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Informe retirada e itens para devolução.",
      });
    }

    const withdrawal = await prisma.uniformWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        items: {
          include: {
            uniformStockSize: {
              include: { item: true },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Retirada não encontrada." });
    }

    if (["SETTLED_RETURN", "SETTLED_DISCOUNT"].includes(withdrawal.status)) {
      return res.status(400).json({
        success: false,
        message: "Retirada já finalizada.",
      });
    }

    const itemMap = new Map(withdrawal.items.map((i) => [i.id, i]));
    for (const input of items) {
      const withdrawalItemId = Number(input.uniformWithdrawalItemId);
      const qty = Number(input.quantity || 0);
      const item = itemMap.get(withdrawalItemId);
      if (!item || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item de devolução inválido.",
        });
      }
      const pending = Math.max(getPendingQuantity(item), 0);
      if (qty > pending) {
        return res.status(400).json({
          success: false,
          message: `Quantidade de devolução acima do pendente no item ${withdrawalItemId}.`,
        });
      }
    }

    const userId = Number(req.user.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      for (const input of items) {
        const withdrawalItemId = Number(input.uniformWithdrawalItemId);
        const qty = Number(input.quantity);
        const item = itemMap.get(withdrawalItemId);

        await tx.uniformWithdrawalItem.update({
          where: { id: withdrawalItemId },
          data: { returnedQuantity: { increment: qty } },
        });

        await tx.uniformStockSize.update({
          where: { id: item.uniformStockSizeId },
          data: { qtyLoanStock: { increment: qty } },
        });

        await tx.uniformMovement.create({
          data: {
            uniformStockSizeId: item.uniformStockSizeId,
            movementType: "RETURN_TO_LOAN",
            originType: "SETTLEMENT",
            referenceType: "UniformWithdrawal",
            referenceId: withdrawal.id,
            quantity: qty,
            userId,
            notes: `Devolução parcial de uniforme. ItemRetirada=${withdrawalItemId}.`,
          },
        });
      }

      const refreshedItems = await tx.uniformWithdrawalItem.findMany({
        where: { uniformWithdrawalId: withdrawal.id },
      });
      const pendingTotal = refreshedItems.reduce((acc, i) => acc + Math.max(getPendingQuantity(i), 0), 0);

      const newStatus = pendingTotal === 0 ? "SETTLED_RETURN" : "PARTIAL_RETURN";

      const updated = await tx.uniformWithdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: newStatus,
          notes: notes || withdrawal.notes,
          updatedAt: now,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_RETURN_ITEMS",
          changes: { uniformWithdrawalId: withdrawal.id, items },
          newData: { status: newStatus, notes: notes || withdrawal.notes || null },
          createdAt: now,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      message: "Devolução registrada com sucesso.",
      data: result,
    });
  } catch (error) {
    console.error("Erro ao devolver itens da retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const settleUniformWithdrawal = async (req, res) => {
  if (!requireDpOrAdmin(req, res)) return;

  try {
    const withdrawalId = Number(req.params.id);
    const { notes, items } = req.body;

    const withdrawal = await prisma.uniformWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        items: {
          include: {
            uniformStockSize: {
              include: { item: true },
            },
          },
        },
      },
    });

    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Retirada não encontrada." });
    }

    if (["SETTLED_RETURN", "SETTLED_DISCOUNT"].includes(withdrawal.status)) {
      return res.status(400).json({ success: false, message: "Retirada já finalizada." });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Informe os itens e quantidades para baixa financeira.",
      });
    }

    const pendingMap = new Map();
    for (const item of withdrawal.items) {
      pendingMap.set(item.id, Math.max(getPendingQuantity(item), 0));
    }

    let totalToDiscount = 0;
    const discountItems = [];
    for (const entry of items) {
      const withdrawalItemId = Number(entry.uniformWithdrawalItemId);
      const quantity = Number(entry.quantity || 0);
      const withdrawalItem = withdrawal.items.find((i) => i.id === withdrawalItemId);
      const pending = pendingMap.get(withdrawalItemId) || 0;

      if (!withdrawalItem || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item/quantidade inválido para baixa financeira.",
        });
      }
      if (quantity > pending) {
        return res.status(400).json({
          success: false,
          message: `Quantidade de baixa acima do pendente no item ${withdrawalItemId}.`,
        });
      }

      const unitValue = getItemUnitValue(withdrawalItem.uniformStockSize?.item?.itemVal);
      totalToDiscount += unitValue * quantity;
      discountItems.push({ withdrawalItem, quantity, unitValue });
    }

    if (discountItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Não há itens válidos para baixa financeira.",
      });
    }

    const userId = Number(req.user.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      for (const { withdrawalItem, quantity } of discountItems) {
        await tx.uniformWithdrawalItem.update({
          where: { id: withdrawalItem.id },
          data: { discountedQuantity: { increment: quantity } },
        });

        await tx.uniformMovement.create({
          data: {
            uniformStockSizeId: withdrawalItem.uniformStockSizeId,
            movementType: "DISCOUNT",
            originType: "SETTLEMENT",
            referenceType: "UniformWithdrawal",
            referenceId: withdrawal.id,
            quantity,
            userId,
            notes: `Baixa financeira por desconto. ItemRetirada=${withdrawalItem.id}.`,
          },
        });
      }

      const refreshedItems = await tx.uniformWithdrawalItem.findMany({
        where: { uniformWithdrawalId: withdrawal.id },
      });
      const pendingTotal = refreshedItems.reduce((acc, i) => acc + Math.max(getPendingQuantity(i), 0), 0);
      const newStatus = pendingTotal === 0 ? "SETTLED_DISCOUNT" : "PARTIAL_RETURN";

      const updated = await tx.uniformWithdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status: newStatus,
          chargeReason: `Baixa financeira: R$ ${totalToDiscount.toFixed(2)}`,
          notes: notes || withdrawal.notes,
          updatedAt: now,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_SETTLEMENT_DISCOUNT",
          changes: {
            uniformWithdrawalId: withdrawal.id,
            totalToDiscount,
            items: discountItems.map(({ withdrawalItem, quantity, unitValue }) => ({
              uniformWithdrawalItemId: withdrawalItem.id,
              quantity,
              unitValue,
            })),
          },
          newData: { status: newStatus, notes: notes || withdrawal.notes || null },
          createdAt: now,
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      message: `Baixa financeira registrada com sucesso. Total: R$ ${totalToDiscount.toFixed(2)}.`,
      data: { ...result, totalToDiscount },
    });
  } catch (error) {
    console.error("Erro ao liquidar retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const getEmployeeUniformDpPendencies = async (req, res) => {
  if (!requireDpOrAdmin(req, res)) return;

  try {
    const { cpf } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const withdrawals = await prisma.uniformWithdrawal.findMany({
      where: {
        employeeId: employee.id,
        status: { in: ["REGULAR", "EXEMPT", "CHARGEABLE", "PARTIAL_RETURN"] },
      },
      orderBy: { withdrawDate: "desc" },
      include: {
        items: {
          include: {
            uniformStockSize: {
              include: { item: true },
            },
          },
        },
      },
    });

    const data = withdrawals
      .map((w) => {
        const items = w.items
          .map((i) => {
            const pendingQuantity = Math.max(getPendingQuantity(i), 0);
            const unitValue = getItemUnitValue(i.uniformStockSize?.item?.itemVal);
            return {
              ...i,
              pendingQuantity,
              unitValue,
              pendingValue: Number((pendingQuantity * unitValue).toFixed(2)),
            };
          })
          .filter((i) => i.pendingQuantity > 0);

        const totalPendingValue = Number(
          items.reduce((acc, i) => acc + i.pendingValue, 0).toFixed(2)
        );

        return {
          ...w,
          items,
          totalPendingValue,
        };
      })
      .filter((w) => w.items.length > 0);

    return res.json({
      success: true,
      data: {
        employee,
        withdrawals: data,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar pendências DP de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const listUniformWithdrawals = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const { status, cpf, year } = req.query;
    const where = {};

    if (status) where.status = status;
    if (year) where.year = Number(year);

    if (cpf) {
      const employee = await prisma.employee.findUnique({
        where: { cpf },
        select: { id: true },
      });
      if (!employee) {
        return res.json({ success: true, data: [] });
      }
      where.employeeId = employee.id;
    }

    const data = await prisma.uniformWithdrawal.findMany({
      where,
      orderBy: { withdrawDate: "desc" },
      include: {
        employee: { select: { id: true, name: true, cpf: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            uniformStockSize: {
              include: { item: true },
            },
          },
        },
      },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar retiradas de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const listUniformStockOptions = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const data = await prisma.uniformStockSize.findMany({
      where: {
        qtyMainStock: {
          gt: 0,
        },
        item: {
          isUniform: 1,
          active: 1,
        },
      },
      orderBy: [{ itemId: "asc" }, { size: "asc" }],
      include: {
        item: true,
      },
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar opções de uniforme para retirada:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};




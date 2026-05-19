import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const getOrCreateUniformSetting = async (tx = prisma) => {
  const existing = await tx.uniformSetting.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return tx.uniformSetting.create({
    data: { annualLimit: 2 },
  });
};

export const getUniformSettings = async (_req, res) => {
  try {
    const settings = await getOrCreateUniformSetting();
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Erro ao carregar configuração de uniformes:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const updateUniformAnnualLimit = async (req, res) => {
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
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const getEmployeeUniformSummary = async (req, res) => {
  try {
    const { cpf } = req.params;
    const year = Number(req.query.year) || new Date().getFullYear();

    const employee = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const settings = await getOrCreateUniformSetting();
    const limitApplied = Number(settings.annualLimit || 2);

    const aggregate = await prisma.uniformWithdrawal.aggregate({
      where: { employeeId: employee.id, year },
      _sum: { totalQuantity: true },
    });

    const withdrawnInYear = aggregate._sum.totalQuantity || 0;
    const remaining = Math.max(limitApplied - withdrawnInYear, 0);

    const lastWithdrawal = await prisma.uniformWithdrawal.findFirst({
      where: { employeeId: employee.id },
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

    return res.json({
      success: true,
      data: {
        employee,
        year,
        limitApplied,
        withdrawnInYear,
        remaining,
        lastWithdrawal,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar resumo de uniformes:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const createUniformWithdrawal = async (req, res) => {
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

    const totalQuantity = items.reduce(
      (acc, item) => acc + Number(item.quantity || 0),
      0
    );

    if (totalQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantidade total da retirada deve ser maior que zero.",
      });
    }

    const aggregate = await prisma.uniformWithdrawal.aggregate({
      where: { employeeId: employee.id, year },
      _sum: { totalQuantity: true },
    });
    const withdrawnInYear = aggregate._sum.totalQuantity || 0;
    const willExceedLimit = withdrawnInYear + totalQuantity > limitApplied;

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
    const stockRecords = await prisma.uniformStockSize.findMany({
      where: { id: { in: stockIds } },
    });
    const stockMap = new Map(stockRecords.map((s) => [s.id, s]));

    for (const item of items) {
      const stockId = Number(item.uniformStockSizeId);
      const quantity = Number(item.quantity);
      const stock = stockMap.get(stockId);
      if (!stock || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item de estoque inválido na retirada.",
        });
      }
      if (stock.qtyMainStock < quantity) {
        return res.status(400).json({
          success: false,
          message: `Saldo insuficiente para item ${stockId}.`,
        });
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
        const quantity = Number(item.quantity);

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
          action: "Retirada de Uniforme",
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
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const listUniformWithdrawals = async (req, res) => {
  try {
    const { status, cpf, year } = req.query;
    const where = {};

    if (status) where.status = status;
    if (year) where.year = Number(year);

    if (cpf) {
      const employee = await prisma.employee.findUnique({ where: { cpf } });
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
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

export const settleUniformWithdrawal = async (req, res) => {
  try {
    const { id } = req.params;
    const { settlementType, notes } = req.body;
    const normalized = (settlementType || "").trim().toUpperCase();

    if (!["RETURN", "DISCOUNT"].includes(normalized)) {
      return res.status(400).json({
        success: false,
        message: "Tipo de liquidação inválido. Use RETURN ou DISCOUNT.",
      });
    }

    const withdrawal = await prisma.uniformWithdrawal.findUnique({
      where: { id: Number(id) },
      include: { items: true },
    });
    if (!withdrawal) {
      return res.status(404).json({ success: false, message: "Retirada não encontrada." });
    }

    const userId = req.user.id;
    const now = new Date();

    const status = normalized === "RETURN" ? "SETTLED_RETURN" : "SETTLED_DISCOUNT";

    const result = await prisma.$transaction(async (tx) => {
      const updated = await tx.uniformWithdrawal.update({
        where: { id: withdrawal.id },
        data: {
          status,
          notes: notes || withdrawal.notes,
          updatedAt: now,
        },
      });

      if (normalized === "RETURN") {
        for (const item of withdrawal.items) {
          await tx.uniformStockSize.update({
            where: { id: item.uniformStockSizeId },
            data: { qtyLoanStock: { increment: item.quantity } },
          });

          await tx.uniformMovement.create({
            data: {
              uniformStockSizeId: item.uniformStockSizeId,
              movementType: "RETURN_TO_LOAN",
              originType: "SETTLEMENT",
              referenceType: "UniformWithdrawal",
              referenceId: withdrawal.id,
              quantity: item.quantity,
              userId,
              notes: "Liquidação por devolução para estoque de empréstimos.",
            },
          });
        }
      }

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_SETTLEMENT",
          changes: { uniformWithdrawalId: withdrawal.id, settlementType: normalized },
          newData: { status, notes: notes || withdrawal.notes || null },
        },
      });

      return updated;
    });

    return res.json({
      success: true,
      message: "Liquidação registrada com sucesso.",
      data: result,
    });
  } catch (error) {
    console.error("Erro ao liquidar retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: "Erro no servidor." });
  }
};

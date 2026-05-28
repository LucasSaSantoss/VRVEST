import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";

const prisma = new PrismaClient();
const emailCopiado = process.env.EMAIL_COPIADO;

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

const UNIFORM_WITHDRAWAL_SAFE_SELECT = {
  id: true,
  employeeId: true,
  userId: true,
  year: true,
  withdrawDate: true,
  totalQuantity: true,
  limitApplied: true,
  status: true,
  nonDeliveryJustification: true,
  chargeReason: true,
  notes: true,
  createdAt: true,
};

const isOperatorOrAdmin = (level) => Number(level) >= 3;
const isAdmin = (level) => Number(level) >= 4;
const isRhOrAdmin = (level) => Number(level) === 2 || isAdmin(level);

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

const requireRhOrAdmin = (req, res) => {
  if (!isRhOrAdmin(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas RH ou administrador.",
    });
    return false;
  }
  return true;
};

const requireAdmin = (req, res) => {
  if (!isAdmin(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas administrador.",
    });
    return false;
  }
  return true;
};

const getOrCreateUniformSetting = async (tx = prisma) => {
  const existing = await tx.uniformSetting.findFirst({ orderBy: { id: "asc" } });
  if (existing) return existing;

  return tx.uniformSetting.create({
    data: { annualLimit: 2, allowZeroOrNegativeStockMovement: 0 },
  });
};

const getItemUnitValue = (itemVal) => {
  if (itemVal === null || itemVal === undefined) return 0;
  const normalized = String(itemVal).replace(/\./g, "").replace(",", ".");
  const numeric = Number(normalized);
  return Number.isFinite(numeric) ? numeric : 0;
};

const getPendingQuantity = (withdrawalItem) =>
  Number(withdrawalItem.quantity || 0) -
  Number(withdrawalItem.returnedQuantity || 0) -
  Number(withdrawalItem.discountedQuantity || 0);

const getPendingLoanQuantity = (loanItem) =>
  Number(loanItem.quantity || 0) - Number(loanItem.returnedQuantity || 0);

const isStockMovementWithoutBalanceAllowed = (settings) =>
  Number(settings?.allowZeroOrNegativeStockMovement || 0) === 1;

const STATUS_RETIRADA_EMAIL_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Extra",
  CHARGEABLE: "Com Cobrança",
  PARTIAL_RETURN: "Devolução Parcial",
  SETTLED_RETURN: "Devolução Total",
  SETTLED_DISCOUNT: "Baixa Financeira",
};

const formatarStatusParaEmail = (status) =>
  STATUS_RETIRADA_EMAIL_LABEL[status] || status || "-";

const STATUS_EMPRESTIMO_EMAIL_LABEL = {
  OPEN: "Em Aberto",
  PARTIAL_RETURN: "Devolução Parcial",
  SETTLED_RETURN: "Devolução Total",
};

const formatarStatusEmprestimoParaEmail = (status) =>
  STATUS_EMPRESTIMO_EMAIL_LABEL[status] || status || "-";

const montarTextoEmailRetirada = ({
  employee,
  operatorName,
  withdrawal,
  retiradaItems,
}) => {
  const dataHora = withdrawal?.withdrawDate
    ? new Date(withdrawal.withdrawDate).toLocaleString("pt-BR")
    : "-";
  const linhasItens = retiradaItems
    .map((item, idx) => {
      const nome = item?.uniformStockSize?.item?.itemName || "Uniforme";
      const tamanho = item?.uniformStockSize?.size || "-";
      const qtd = Number(item?.quantity || 0);
      return `${idx + 1}. ${nome} | Tam: ${tamanho} | Qtd: ${qtd}`;
    })
    .join("\n");

  return `Olá ${employee?.name || "colaborador(a)"},

Informamos o registro de retirada de uniforme em seu nome.

Protocolo da retirada: #${withdrawal?.id || "-"}
Data/Hora: ${dataHora}
Colaborador: ${employee?.name || "-"}
CPF: ${employee?.cpf || "-"}
Setor: ${employee?.sector || "-"}
Cargo: ${employee?.position || "-"}
Operador responsável: ${operatorName || "-"}

Status da retirada: ${formatarStatusParaEmail(withdrawal?.status)}
Limite anual aplicado: ${withdrawal?.limitApplied ?? "-"}
Quantidade de uniformes nesta retirada: ${withdrawal?.totalQuantity ?? "-"}

Itens retirados:
${linhasItens || "-"}

Justificativa de não entrega: ${withdrawal?.nonDeliveryJustification || "Não informada"}
Motivo de cobrança: ${withdrawal?.chargeReason || "Não se aplica"}
Observações: ${withdrawal?.notes || "Não informado"}

Este e-mail é um comprovante automático da operação.
`;
};

const montarTextoEmailDevolucao = ({
  employee,
  operatorName,
  withdrawal,
  devolucaoItems,
  tipoDevolucao,
  observacoes,
}) => {
  const dataHora = new Date().toLocaleString("pt-BR");
  const linhasItens = devolucaoItems
    .map((item, idx) => {
      const nome = item?.uniformStockSize?.item?.itemName || "Uniforme";
      const tamanho = item?.uniformStockSize?.size || "-";
      const qtd = Number(item?.quantity || 0);
      return `${idx + 1}. ${nome} | Tam: ${tamanho} | Qtd: ${qtd}`;
    })
    .join("\n");

  return `Olá ${employee?.name || "colaborador(a)"},

Informamos o registro de ${tipoDevolucao || "devolução de uniforme"} em seu nome.

Protocolo da retirada: #${withdrawal?.id || "-"}
Data/Hora da operação: ${dataHora}
Colaborador: ${employee?.name || "-"}
CPF: ${employee?.cpf || "-"}
Setor: ${employee?.sector || "-"}
Cargo: ${employee?.position || "-"}
Operador responsável: ${operatorName || "-"}

Status atual da retirada: ${formatarStatusParaEmail(withdrawal?.status)}

Itens movimentados na operação:
${linhasItens || "-"}

Observações: ${observacoes || "Não informado"}

Este e-mail é um comprovante automático da operação.
`;
};

const montarTextoEmailEmprestimo = ({
  employee,
  operatorName,
  loan,
  loanItems,
}) => {
  const dataHora = loan?.loanDate
    ? new Date(loan.loanDate).toLocaleString("pt-BR")
    : "-";
  const linhasItens = loanItems
    .map((item, idx) => {
      const nome = item?.uniformStockSize?.item?.itemName || "Uniforme";
      const tamanho = item?.uniformStockSize?.size || "-";
      const qtd = Number(item?.quantity || 0);
      return `${idx + 1}. ${nome} | Tam: ${tamanho} | Qtd: ${qtd}`;
    })
    .join("\n");

  return `Olá ${employee?.name || "colaborador(a)"},

Informamos o registro de empréstimo de uniforme em seu nome.

Protocolo do empréstimo: #${loan?.id || "-"}
Data/Hora: ${dataHora}
Colaborador: ${employee?.name || "-"}
CPF: ${employee?.cpf || "-"}
Setor: ${employee?.sector || "-"}
Cargo: ${employee?.position || "-"}
Operador responsável: ${operatorName || "-"}

Status do empréstimo: ${formatarStatusEmprestimoParaEmail(loan?.status)}

Itens emprestados:
${linhasItens || "-"}

Observações: ${loan?.notes || "Não informado"}

Este e-mail é um comprovante automático da operação.
`;
};

const montarTextoEmailDevolucaoEmprestimo = ({
  employee,
  operatorName,
  loan,
  devolucaoItems,
  observacoes,
}) => {
  const dataHora = new Date().toLocaleString("pt-BR");
  const linhasItens = devolucaoItems
    .map((item, idx) => {
      const nome = item?.uniformStockSize?.item?.itemName || "Uniforme";
      const tamanho = item?.uniformStockSize?.size || "-";
      const qtd = Number(item?.quantity || 0);
      return `${idx + 1}. ${nome} | Tam: ${tamanho} | Qtd: ${qtd}`;
    })
    .join("\n");

  return `Olá ${employee?.name || "colaborador(a)"},

Informamos o registro de devolução de empréstimo de uniforme em seu nome.

Protocolo do empréstimo: #${loan?.id || "-"}
Data/Hora da operação: ${dataHora}
Colaborador: ${employee?.name || "-"}
CPF: ${employee?.cpf || "-"}
Setor: ${employee?.sector || "-"}
Cargo: ${employee?.position || "-"}
Operador responsável: ${operatorName || "-"}

Status atual do empréstimo: ${formatarStatusEmprestimoParaEmail(loan?.status)}

Itens movimentados na operação:
${linhasItens || "-"}

Observações: ${observacoes || "Não informado"}

Este e-mail é um comprovante automático da operação.
`;
};

export const getUniformSettings = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const settings = await getOrCreateUniformSetting();
    return res.json({ success: true, data: settings });
  } catch (error) {
    console.error("Erro ao carregar configuração de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const updateUniformAnnualLimit = async (req, res) => {
  if (!requireAdmin(req, res)) return;

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

export const updateUniformStockMovementPolicy = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const allowFlag = Number(req.body?.allowZeroOrNegativeStockMovement ? 1 : 0);
    const userId = req.user?.id ? Number(req.user.id) : null;

    const updated = await prisma.$transaction(async (tx) => {
      const settings = await getOrCreateUniformSetting(tx);
      const result = await tx.uniformSetting.update({
        where: { id: settings.id },
        data: {
          allowZeroOrNegativeStockMovement: allowFlag,
          updatedByUserId: userId,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_UPDATE_STOCK_MOVEMENT_POLICY",
          changes: { allowZeroOrNegativeStockMovement: allowFlag },
          newData: {
            uniformSettingId: result.id,
            allowZeroOrNegativeStockMovement: result.allowZeroOrNegativeStockMovement,
          },
        },
      });

      return result;
    });

    return res.json({
      success: true,
      message: "Política de movimentação de estoque atualizada com sucesso.",
      data: updated,
    });
  } catch (error) {
    console.error("Erro ao atualizar política de movimentação de estoque:", error);
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
    const allowZeroOrNegativeStockMovement =
      isStockMovementWithoutBalanceAllowed(settings);

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
      select: {
        ...UNIFORM_WITHDRAWAL_SAFE_SELECT,
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

    const lastWithdrawal = await prisma.uniformWithdrawal.findFirst({
      where: { employeeId: employee.id },
      orderBy: { withdrawDate: "desc" },
      select: {
        ...UNIFORM_WITHDRAWAL_SAFE_SELECT,
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
        openWithdrawals: openWithdrawalsNormalized,
        lastWithdrawal,
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
    const allowZeroOrNegativeStockMovement =
      isStockMovementWithoutBalanceAllowed(settings);

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
      if (!allowZeroOrNegativeStockMovement && stock.qtyMainStock < quantity) {
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

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail da retirada enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const withdrawalDetails = await prisma.uniformWithdrawal.findUnique({
        where: { id: result.id },
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

      if (withdrawalDetails) {
        const textoEmail = montarTextoEmailRetirada({
          employee,
          operatorName: req.user?.name || null,
          withdrawal: withdrawalDetails,
          retiradaItems: withdrawalDetails.items || [],
        });

        if (employee?.email) {
          await enviarEmail(
            employee.email,
            `Comprovante de Retirada de Uniforme #${withdrawalDetails.id}`,
            textoEmail
          );
          emailNotification.details.employee = true;
        }

        if (emailCopiado) {
          await enviarEmail(
            emailCopiado,
            `Aviso de Retirada de Uniforme - ${employee?.name || "Colaborador"} (#${withdrawalDetails.id})`,
            textoEmail
          );
          emailNotification.details.system = true;
        }

        if (!emailNotification.details.employee && !emailNotification.details.system) {
          emailNotification = {
            success: false,
            message:
              "Retirada registrada, mas nenhum e-mail foi enviado (destinatários não configurados).",
            details: emailNotification.details,
          };
        }
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Retirada registrada, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de retirada de uniforme:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_WITHDRAWAL_EMAIL_ERROR",
            changes: { uniformWithdrawalId: result.id },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail de retirada:", logError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Retirada registrada com sucesso.",
      data: result,
      emailNotification,
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
        employee: {
          select: EMPLOYEE_SAFE_SELECT,
        },
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

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail da devolução enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const devolucaoItems = items
        .map((entry) => {
          const withdrawalItemId = Number(entry.uniformWithdrawalItemId);
          const originalItem = itemMap.get(withdrawalItemId);
          const quantity = Number(entry.quantity || 0);
          if (!originalItem || quantity <= 0) return null;
          return {
            quantity,
            uniformStockSize: originalItem.uniformStockSize,
          };
        })
        .filter(Boolean);

      const tipoDevolucao =
        result.status === "SETTLED_RETURN"
          ? "devolução total de uniforme"
          : "devolução parcial de uniforme";

      const textoEmail = montarTextoEmailDevolucao({
        employee: withdrawal.employee,
        operatorName: req.user?.name || null,
        withdrawal: result,
        devolucaoItems,
        tipoDevolucao,
        observacoes: notes || withdrawal.notes || null,
      });

      if (withdrawal.employee?.email) {
        await enviarEmail(
          withdrawal.employee.email,
          `Comprovante de ${result.status === "SETTLED_RETURN" ? "Devolução Total" : "Devolução Parcial"} de Uniforme #${withdrawal.id}`,
          textoEmail
        );
        emailNotification.details.employee = true;
      }

      if (emailCopiado) {
        await enviarEmail(
          emailCopiado,
          `Aviso de Devolução de Uniforme - ${withdrawal.employee?.name || "Colaborador"} (#${withdrawal.id})`,
          textoEmail
        );
        emailNotification.details.system = true;
      }

      if (!emailNotification.details.employee && !emailNotification.details.system) {
        emailNotification = {
          success: false,
          message:
            "Devolução registrada, mas nenhum e-mail foi enviado (destinatários não configurados).",
          details: emailNotification.details,
        };
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Devolução registrada, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de devolução de uniforme:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_RETURN_EMAIL_ERROR",
            changes: { uniformWithdrawalId: withdrawal.id },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: withdrawal.employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail de devolução:", logError);
      }
    }

    return res.json({
      success: true,
      message: "Devolução registrada com sucesso.",
      data: result,
      emailNotification,
    });
  } catch (error) {
    console.error("Erro ao devolver itens da retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const registerLegacyUniformReturn = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const { cpf, uniformStockSizeId, quantity, notes } = req.body;
    const qty = Number(quantity || 0);

    if (!cpf || !uniformStockSizeId || qty <= 0) {
      return res.status(400).json({
        success: false,
        message: "Informe CPF, item/tamanho e quantidade para devolução legada.",
      });
    }

    if (!notes || !String(notes).trim()) {
      return res.status(400).json({
        success: false,
        message: "Justificativa obrigatória para devolução legada.",
      });
    }

    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const stockSize = await prisma.uniformStockSize.findUnique({
      where: { id: Number(uniformStockSizeId) },
      include: { item: true },
    });
    if (!stockSize || !stockSize.item || Number(stockSize.item.active) !== 1 || Number(stockSize.item.isUniform) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Item/tamanho inválido para devolução legada.",
      });
    }

    const userId = Number(req.user.id);
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const updatedStock = await tx.uniformStockSize.update({
        where: { id: Number(uniformStockSizeId) },
        data: { qtyLoanStock: { increment: qty } },
      });

      await tx.uniformMovement.create({
        data: {
          uniformStockSizeId: Number(uniformStockSizeId),
          movementType: "RETURN_TO_LOAN",
          originType: "LEGACY_RETURN",
          quantity: qty,
          userId,
          notes: `Devolução legada de uniforme. CPF=${cpf}. Justificativa: ${String(notes).trim()}`,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_LEGACY_RETURN",
          changes: {
            cpf,
            uniformStockSizeId: Number(uniformStockSizeId),
            quantity: qty,
          },
          newData: {
            notes: String(notes).trim(),
            employeeId: employee.id,
          },
          createdAt: now,
        },
      });

      return updatedStock;
    });

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail da devolução legada enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const textoEmail = `Olá ${employee?.name || "colaborador(a)"},

Foi registrada uma devolução legada de uniforme em seu nome.

Data/Hora da operação: ${new Date().toLocaleString("pt-BR")}
Colaborador: ${employee?.name || "-"}
CPF: ${employee?.cpf || "-"}
Setor: ${employee?.sector || "-"}
Cargo: ${employee?.position || "-"}
Operador responsável: ${req.user?.name || "-"}
Item: ${stockSize.item?.itemName || "-"} | Tam: ${stockSize.size || "-"} | Qtd: ${qty}
Justificativa: ${String(notes).trim()}
`;

      if (employee?.email) {
        await enviarEmail(
          employee.email,
          "Comprovante de Devolução Legada de Uniforme",
          textoEmail
        );
        emailNotification.details.employee = true;
      }

      if (emailCopiado) {
        await enviarEmail(
          emailCopiado,
          `Aviso de Devolução Legada de Uniforme - ${employee?.name || "Colaborador"}`,
          textoEmail
        );
        emailNotification.details.system = true;
      }

      if (!emailNotification.details.employee && !emailNotification.details.system) {
        emailNotification = {
          success: false,
          message:
            "Devolução legada registrada, mas nenhum e-mail foi enviado (destinatários não configurados).",
          details: emailNotification.details,
        };
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Devolução legada registrada, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de devolução legada:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_LEGACY_RETURN_EMAIL_ERROR",
            changes: { cpf, uniformStockSizeId: Number(uniformStockSizeId), quantity: qty },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail da devolução legada:", logError);
      }
    }

    return res.json({
      success: true,
      message: "Devolução legada registrada com sucesso.",
      data: result,
      emailNotification,
    });
  } catch (error) {
    console.error("Erro ao registrar devolução legada:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const settleUniformWithdrawal = async (req, res) => {
  if (!requireRhOrAdmin(req, res)) return;

  try {
    const withdrawalId = Number(req.params.id);
    const { notes, items } = req.body;

    const withdrawal = await prisma.uniformWithdrawal.findUnique({
      where: { id: withdrawalId },
      include: {
        employee: {
          select: EMPLOYEE_SAFE_SELECT,
        },
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

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail da baixa financeira enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const devolucaoItems = discountItems.map(({ withdrawalItem, quantity }) => ({
        quantity,
        uniformStockSize: withdrawalItem.uniformStockSize,
      }));

      const textoEmail = montarTextoEmailDevolucao({
        employee: withdrawal.employee,
        operatorName: req.user?.name || null,
        withdrawal: result,
        devolucaoItems,
        tipoDevolucao: "baixa financeira de uniforme",
        observacoes: notes || withdrawal.notes || null,
      });

      if (withdrawal.employee?.email) {
        await enviarEmail(
          withdrawal.employee.email,
          `Comprovante de Baixa Financeira de Uniforme #${withdrawal.id}`,
          `${textoEmail}\nValor total da baixa: R$ ${totalToDiscount.toFixed(2)}`
        );
        emailNotification.details.employee = true;
      }

      if (emailCopiado) {
        await enviarEmail(
          emailCopiado,
          `Aviso de Baixa Financeira de Uniforme - ${withdrawal.employee?.name || "Colaborador"} (#${withdrawal.id})`,
          `${textoEmail}\nValor total da baixa: R$ ${totalToDiscount.toFixed(2)}`
        );
        emailNotification.details.system = true;
      }

      if (!emailNotification.details.employee && !emailNotification.details.system) {
        emailNotification = {
          success: false,
          message:
            "Baixa financeira registrada, mas nenhum e-mail foi enviado (destinatários não configurados).",
          details: emailNotification.details,
        };
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Baixa financeira registrada, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de baixa financeira de uniforme:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_SETTLEMENT_EMAIL_ERROR",
            changes: { uniformWithdrawalId: withdrawal.id },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: withdrawal.employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail de baixa financeira:", logError);
      }
    }

    return res.json({
      success: true,
      message: `Baixa financeira registrada com sucesso. Total: R$ ${totalToDiscount.toFixed(2)}.`,
      data: { ...result, totalToDiscount },
      emailNotification,
    });
  } catch (error) {
    console.error("Erro ao liquidar retirada de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const getEmployeeUniformDpPendencies = async (req, res) => {
  if (!requireRhOrAdmin(req, res)) return;

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
      select: {
        ...UNIFORM_WITHDRAWAL_SAFE_SELECT,
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

export const listUniformLoans = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const { status, cpf, year } = req.query;
    const where = {};

    if (status) where.status = status;
    if (year) {
      const yearNum = Number(year);
      if (!Number.isNaN(yearNum)) {
        const start = new Date(Date.UTC(yearNum, 0, 1, 0, 0, 0));
        const end = new Date(Date.UTC(yearNum + 1, 0, 1, 0, 0, 0));
        where.loanDate = { gte: start, lt: end };
      }
    }

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

    const data = await prisma.uniformLoan.findMany({
      where,
      orderBy: { loanDate: "desc" },
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
    console.error("Erro ao listar empréstimos de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const listUniformStockOptions = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;

  try {
    const settings = await getOrCreateUniformSetting();
    const allowZeroOrNegativeStockMovement =
      isStockMovementWithoutBalanceAllowed(settings);

    const data = await prisma.uniformStockSize.findMany({
      where: {
        ...(allowZeroOrNegativeStockMovement
          ? {}
          : {
              qtyMainStock: {
                gt: 0,
              },
            }),
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

    return res.json({
      success: true,
      data,
      allowZeroOrNegativeStockMovement,
    });
  } catch (error) {
    console.error("Erro ao listar opções de uniforme para retirada:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const listUniformLoanStockOptions = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;
  try {
    const data = await prisma.uniformStockSize.findMany({
      where: {
        item: {
          isUniform: {
            gt: 0,
          },
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
    console.error("Erro ao listar opções de estoque de empréstimo:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const getEmployeeUniformLoanSummary = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;
  try {
    const { cpf } = req.params;
    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const openLoans = await prisma.uniformLoan.findMany({
      where: { employeeId: employee.id, status: { in: ["OPEN", "PARTIAL_RETURN"] } },
      orderBy: { loanDate: "desc" },
      include: {
        items: {
          include: {
            uniformStockSize: { include: { item: true } },
          },
        },
      },
    });

    const openLoansNormalized = openLoans
      .map((loan) => {
        const items = loan.items.map((item) => ({
          ...item,
          pendingQuantity: Math.max(getPendingLoanQuantity(item), 0),
        }));
        const pendingTotal = items.reduce((acc, item) => acc + item.pendingQuantity, 0);
        return { ...loan, items, pendingTotal };
      })
      .filter((loan) => loan.pendingTotal > 0);

    const lastLoan = await prisma.uniformLoan.findFirst({
      where: { employeeId: employee.id },
      orderBy: { loanDate: "desc" },
      include: {
        items: {
          include: {
            uniformStockSize: { include: { item: true } },
          },
        },
      },
    });

    return res.json({
      success: true,
      data: { employee, openLoans: openLoansNormalized, lastLoan },
    });
  } catch (error) {
    console.error("Erro ao carregar resumo de empréstimos de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const createUniformLoan = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;
  try {
    const { cpf, items, notes } = req.body;
    if (!cpf || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "CPF e itens são obrigatórios." });
    }

    const employee = await prisma.employee.findUnique({ where: { cpf }, select: EMPLOYEE_SAFE_SELECT });
    if (!employee || employee.active !== 1) {
      return res.status(400).json({ success: false, message: "Colaborador inválido ou inativo." });
    }

    const stockIds = items.map((item) => Number(item.uniformStockSizeId));
    const stockRecords = await prisma.uniformStockSize.findMany({ where: { id: { in: stockIds } } });
    const stockMap = new Map(stockRecords.map((s) => [s.id, s]));
    const userId = Number(req.user.id);
    const now = new Date();

    for (const item of items) {
      const stockId = Number(item.uniformStockSizeId);
      const quantity = Number(item.quantity || 0);
      const stock = stockMap.get(stockId);
      if (!stock || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Item de empréstimo inválido." });
      }
      if (Number(stock.qtyLoanStock) < quantity) {
        return res.status(400).json({ success: false, message: `Saldo insuficiente no estoque de empréstimos para item ${stockId}.` });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.uniformLoan.create({
        data: {
          employeeId: employee.id,
          userId,
          loanDate: now,
          status: "OPEN",
          notes: notes || null,
        },
      });

      for (const item of items) {
        const stockId = Number(item.uniformStockSizeId);
        const quantity = Number(item.quantity || 0);
        await tx.uniformLoanItem.create({
          data: { uniformLoanId: loan.id, uniformStockSizeId: stockId, quantity },
        });
        await tx.uniformStockSize.update({
          where: { id: stockId },
          data: { qtyLoanStock: { decrement: quantity } },
        });
        await tx.uniformMovement.create({
          data: {
            uniformStockSizeId: stockId,
            movementType: "LOAN_EXIT",
            originType: "LOAN_WITHDRAWAL",
            referenceType: "UniformLoan",
            referenceId: loan.id,
            quantity,
            userId,
            notes: "Saída de empréstimo para colaborador.",
          },
        });
      }

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_LOAN_CREATE",
          newData: { employeeId: employee.id, uniformLoanId: loan.id, items },
          createdAt: now,
        },
      });

      return loan;
    });

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail do empréstimo enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const loanDetails = await prisma.uniformLoan.findUnique({
        where: { id: result.id },
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

      if (loanDetails) {
        const textoEmail = montarTextoEmailEmprestimo({
          employee,
          operatorName: req.user?.name || null,
          loan: loanDetails,
          loanItems: loanDetails.items || [],
        });

        if (employee?.email) {
          await enviarEmail(
            employee.email,
            `Comprovante de Empréstimo de Uniforme #${loanDetails.id}`,
            textoEmail
          );
          emailNotification.details.employee = true;
        }

        if (emailCopiado) {
          await enviarEmail(
            emailCopiado,
            `Aviso de Empréstimo de Uniforme - ${employee?.name || "Colaborador"} (#${loanDetails.id})`,
            textoEmail
          );
          emailNotification.details.system = true;
        }

        if (!emailNotification.details.employee && !emailNotification.details.system) {
          emailNotification = {
            success: false,
            message:
              "Empréstimo registrado, mas nenhum e-mail foi enviado (destinatários não configurados).",
            details: emailNotification.details,
          };
        }
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Empréstimo registrado, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de empréstimo de uniforme:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_LOAN_EMAIL_ERROR",
            changes: { uniformLoanId: result.id },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail de empréstimo:", logError);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Empréstimo registrado com sucesso.",
      data: result,
      emailNotification,
    });
  } catch (error) {
    console.error("Erro ao registrar empréstimo de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

export const returnUniformLoanItems = async (req, res) => {
  if (!requireOperatorOrAdmin(req, res)) return;
  try {
    const loanId = Number(req.params.id);
    const { items, notes } = req.body;
    if (!loanId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "Informe empréstimo e itens para devolução." });
    }

    const loan = await prisma.uniformLoan.findUnique({
      where: { id: loanId },
      include: {
        employee: {
          select: EMPLOYEE_SAFE_SELECT,
        },
        items: { include: { uniformStockSize: { include: { item: true } } } },
      },
    });
    if (!loan) return res.status(404).json({ success: false, message: "Empréstimo não encontrado." });
    if (loan.status === "SETTLED_RETURN") {
      return res.status(400).json({ success: false, message: "Empréstimo já finalizado." });
    }

    const itemMap = new Map(loan.items.map((item) => [item.id, item]));
    for (const input of items) {
      const loanItemId = Number(input.uniformLoanItemId);
      const quantity = Number(input.quantity || 0);
      const loanItem = itemMap.get(loanItemId);
      if (!loanItem || quantity <= 0) {
        return res.status(400).json({ success: false, message: "Item de devolução de empréstimo inválido." });
      }
      const pending = Math.max(getPendingLoanQuantity(loanItem), 0);
      if (quantity > pending) {
        return res.status(400).json({ success: false, message: `Quantidade acima do pendente no item ${loanItemId}.` });
      }
    }

    const userId = Number(req.user.id);
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      for (const input of items) {
        const loanItemId = Number(input.uniformLoanItemId);
        const quantity = Number(input.quantity || 0);
        const loanItem = itemMap.get(loanItemId);
        await tx.uniformLoanItem.update({
          where: { id: loanItemId },
          data: { returnedQuantity: { increment: quantity } },
        });
        await tx.uniformStockSize.update({
          where: { id: loanItem.uniformStockSizeId },
          data: { qtyLoanStock: { increment: quantity } },
        });
        await tx.uniformMovement.create({
          data: {
            uniformStockSizeId: loanItem.uniformStockSizeId,
            movementType: "LOAN_RETURN",
            originType: "LOAN_SETTLEMENT",
            referenceType: "UniformLoan",
            referenceId: loan.id,
            quantity,
            userId,
            notes: "Devolução de empréstimo por colaborador.",
          },
        });
      }

      const refreshedItems = await tx.uniformLoanItem.findMany({ where: { uniformLoanId: loan.id } });
      const pendingTotal = refreshedItems.reduce((acc, item) => acc + Math.max(getPendingLoanQuantity(item), 0), 0);
      const status = pendingTotal === 0 ? "SETTLED_RETURN" : "PARTIAL_RETURN";
      const updated = await tx.uniformLoan.update({
        where: { id: loan.id },
        data: { status, notes: notes || loan.notes, updatedAt: now },
      });
      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_LOAN_RETURN",
          changes: { uniformLoanId: loan.id, items },
          newData: { status, notes: notes || loan.notes || null },
          createdAt: now,
        },
      });
      return updated;
    });

    let emailNotification = {
      success: true,
      message: "Notificações de e-mail da devolução de empréstimo enviadas com sucesso.",
      details: { employee: false, system: false },
    };

    try {
      const devolucaoItems = items
        .map((entry) => {
          const loanItemId = Number(entry.uniformLoanItemId);
          const originalItem = itemMap.get(loanItemId);
          const quantity = Number(entry.quantity || 0);
          if (!originalItem || quantity <= 0) return null;
          return {
            quantity,
            uniformStockSize: originalItem.uniformStockSize,
          };
        })
        .filter(Boolean);

      const textoEmail = montarTextoEmailDevolucaoEmprestimo({
        employee: loan.employee,
        operatorName: req.user?.name || null,
        loan: result,
        devolucaoItems,
        observacoes: notes || loan.notes || null,
      });

      if (loan.employee?.email) {
        await enviarEmail(
          loan.employee.email,
          `Comprovante de ${result.status === "SETTLED_RETURN" ? "Devolução Total" : "Devolução Parcial"} de Empréstimo #${loan.id}`,
          textoEmail
        );
        emailNotification.details.employee = true;
      }

      if (emailCopiado) {
        await enviarEmail(
          emailCopiado,
          `Aviso de Devolução de Empréstimo - ${loan.employee?.name || "Colaborador"} (#${loan.id})`,
          textoEmail
        );
        emailNotification.details.system = true;
      }

      if (!emailNotification.details.employee && !emailNotification.details.system) {
        emailNotification = {
          success: false,
          message:
            "Devolução de empréstimo registrada, mas nenhum e-mail foi enviado (destinatários não configurados).",
          details: emailNotification.details,
        };
      }
    } catch (emailError) {
      emailNotification = {
        success: false,
        message:
          "Devolução de empréstimo registrada, mas houve falha no envio das notificações de e-mail.",
        details: emailNotification.details,
      };
      console.error("Erro ao enviar e-mails de devolução de empréstimo:", emailError);
      try {
        await prisma.userLog.create({
          data: {
            userId,
            action: "UNIFORM_LOAN_RETURN_EMAIL_ERROR",
            changes: { uniformLoanId: loan.id },
            newData: {
              error: emailError?.message || String(emailError),
              employeeEmail: loan.employee?.email || null,
              copiedEmail: emailCopiado || null,
            },
          },
        });
      } catch (logError) {
        console.error("Erro ao registrar falha de e-mail de devolução de empréstimo:", logError);
      }
    }

    return res.json({
      success: true,
      message: "Devolução de empréstimo registrada com sucesso.",
      data: result,
      emailNotification,
    });
  } catch (error) {
    console.error("Erro ao devolver empréstimo de uniforme:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};






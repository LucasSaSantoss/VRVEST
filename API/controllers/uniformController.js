import { PrismaClient } from "@prisma/client";
// [MANUTENCAO] Motivo: distinguir falha real de e-mail nas operações modernas de uniformes.
// [MANUTENCAO] Impacto: operação permanece registrada e o frontend recebe emailNotification com a falha.
// [MANUTENCAO] Data: 2026-06-22
// [MANUTENCAO] Autor: Márlon Etiene
import { enviarEmailComConfirmacao as enviarEmail } from "../emailService/emailService.js";

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
  originType: true,
  status: true,
  nonDeliveryJustification: true,
  chargeReason: true,
  notes: true,
  createdAt: true,
};

const PERFIL_OPERADOR = 1;
const PERFIL_DP = 3;
const PERFIL_SUPERVISOR = 4;

// [MANUTENCAO] Motivo: alinhar rotas do módulo de uniformes aos níveis oficiais de perfil.
// [MANUTENCAO] Impacto: ajusta apenas rotinas novas de uniformes; fluxos legados permanecem inalterados.
// [MANUTENCAO] Data: 2026-06-05
// [MANUTENCAO] Autor: Márlon Etiene
const isOperatorOrSupervisor = (level) =>
  Number(level) === PERFIL_OPERADOR || Number(level) === PERFIL_SUPERVISOR;
const isSupervisor = (level) => Number(level) === PERFIL_SUPERVISOR;
const isDpOrSupervisor = (level) =>
  Number(level) === PERFIL_DP || isSupervisor(level);
const UNIFORMES_RELEASE_MODE = String(
  process.env.UNIFORMES_FASE_LIBERACAO || "BY_PROFILE"
).toUpperCase();
const isUniformesAdminOnly = () => UNIFORMES_RELEASE_MODE === "ADMIN_ONLY";

const requireOperatorOrAdmin = (req, res) => {
  // [MANUTENCAO] Motivo: habilitar implantação controlada dos módulos novos de uniformes.
  // [MANUTENCAO] Impacto: em ADMIN_ONLY, apenas supervisor acessa temporariamente rotinas de operador/DP.
  // [MANUTENCAO] Data: 2026-05-29
  // [MANUTENCAO] Autor: Márlon Etiene
  if (isUniformesAdminOnly() && !isSupervisor(req.user?.level)) {
    res.status(403).json({
      success: false,
      message:
        "Módulo de uniformes em liberação controlada. Acesso temporário apenas para supervisor.",
    });
    return false;
  }

  if (!isOperatorOrSupervisor(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas operador ou supervisor.",
    });
    return false;
  }
  return true;
};

const requireRhOrAdmin = (req, res) => {
  // [MANUTENCAO] Motivo: habilitar implantação controlada dos módulos novos de uniformes.
  // [MANUTENCAO] Impacto: em ADMIN_ONLY, apenas supervisor acessa temporariamente rotinas de operador/DP.
  // [MANUTENCAO] Data: 2026-05-29
  // [MANUTENCAO] Autor: Márlon Etiene
  if (isUniformesAdminOnly() && !isSupervisor(req.user?.level)) {
    res.status(403).json({
      success: false,
      message:
        "Módulo de uniformes em liberação controlada. Acesso temporário apenas para supervisor.",
    });
    return false;
  }

  if (!isDpOrSupervisor(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas DP ou supervisor.",
    });
    return false;
  }
  return true;
};

const requireAdmin = (req, res) => {
  if (!isSupervisor(req.user?.level)) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas supervisor.",
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

const WORK_TYPES = {
  PLANTONISTA: "PLANTONISTA",
  DIARISTA: "DIARISTA",
};

const WITHDRAWAL_ORIGIN_TYPES = {
  SYSTEM: "SYSTEM_WITHDRAWAL",
  RETROACTIVE: "RETROACTIVE_WITHDRAWAL",
};

const normalizeWorkType = (value) => {
  const normalized = String(value || "").trim().toUpperCase();
  if (normalized === WORK_TYPES.PLANTONISTA) return WORK_TYPES.PLANTONISTA;
  if (normalized === WORK_TYPES.DIARISTA) return WORK_TYPES.DIARISTA;
  return null;
};

const resolveAnnualLimitByWorkType = (settings, workType) => {
  const fallback = Number(settings?.annualLimit || 2);
  if (workType === WORK_TYPES.PLANTONISTA) {
    return Number(settings?.annualLimitPlantonista || fallback);
  }
  return Number(settings?.annualLimitDiarista || fallback);
};

const addMonthsSafely = (date, months) => {
  const base = new Date(date);
  const d = new Date(base.getTime());
  d.setMonth(d.getMonth() + Number(months || 0));
  return d;
};

const parseRetroactiveWithdrawalDate = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return null;

  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const year = Number(dateOnlyMatch[1]);
    const month = Number(dateOnlyMatch[2]);
    const day = Number(dateOnlyMatch[3]);
    const date = new Date(year, month - 1, day, 12, 0, 0, 0);
    if (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    ) {
      return date;
    }
    return null;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isBeforeToday = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return candidate < today;
};

const formatarDataHoraPtBr = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "medium",
  }).format(date);
};

const extrairIdItemMovimentacao = (notes, fieldName) => {
  const match = String(notes || "").match(new RegExp(`${fieldName}=(\\d+)`, "i"));
  return match ? Number(match[1]) : null;
};

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
    ? formatarDataHoraPtBr(withdrawal.withdrawDate)
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
  operationDate,
}) => {
  const dataHora = formatarDataHoraPtBr(operationDate || new Date());
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
    ? formatarDataHoraPtBr(loan.loanDate)
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
  operationDate,
}) => {
  const dataHora = formatarDataHoraPtBr(operationDate || new Date());
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
    const body = req.body || {};
    const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

    const annualLimitPlantonista = Number(body.annualLimitPlantonista);
    const annualLimitDiarista = Number(body.annualLimitDiarista);
    const annualLimitLegacy = Number(body.annualLimit);

    const hasNewPayload =
      hasOwn(body, "annualLimitPlantonista") || hasOwn(body, "annualLimitDiarista");
    const hasLegacyPayload = hasOwn(body, "annualLimit");

    if (!hasNewPayload && !hasLegacyPayload) {
      return res.status(400).json({
        success: false,
        message:
          "Payload inválido para configuração de limite anual. Informe limite por jornada.",
      });
    }

    if (hasNewPayload) {
      if (!Number.isInteger(annualLimitPlantonista) || annualLimitPlantonista <= 0) {
        return res.status(400).json({
          success: false,
          message: "Limite anual para plantonista deve ser inteiro maior que zero.",
        });
      }
      if (!Number.isInteger(annualLimitDiarista) || annualLimitDiarista <= 0) {
        return res.status(400).json({
          success: false,
          message: "Limite anual para diarista deve ser inteiro maior que zero.",
        });
      }
    } else if (!Number.isInteger(annualLimitLegacy) || annualLimitLegacy <= 0) {
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
          annualLimit: hasNewPayload ? annualLimitDiarista : annualLimitLegacy,
          annualLimitPlantonista: hasNewPayload
            ? annualLimitPlantonista
            : annualLimitLegacy,
          annualLimitDiarista: hasNewPayload
            ? annualLimitDiarista
            : annualLimitLegacy,
          updatedByUserId: userId,
        },
      });

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_UPDATE_ANNUAL_LIMIT",
          changes: {
            annualLimit: hasNewPayload ? annualLimitDiarista : annualLimitLegacy,
            annualLimitPlantonista: hasNewPayload
              ? annualLimitPlantonista
              : annualLimitLegacy,
            annualLimitDiarista: hasNewPayload
              ? annualLimitDiarista
              : annualLimitLegacy,
          },
          newData: {
            uniformSettingId: result.id,
            annualLimit: result.annualLimit,
            annualLimitPlantonista: result.annualLimitPlantonista,
            annualLimitDiarista: result.annualLimitDiarista,
          },
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
    const requestedWorkType = normalizeWorkType(req.query.workType) || WORK_TYPES.DIARISTA;

    const employee = await prisma.employee.findUnique({
      where: { cpf },
      select: EMPLOYEE_SAFE_SELECT,
    });

    if (!employee) {
      return res.status(404).json({ success: false, message: "Colaborador não encontrado." });
    }

    const settings = await getOrCreateUniformSetting();
    const limitsByWorkType = {
      plantonista: resolveAnnualLimitByWorkType(settings, WORK_TYPES.PLANTONISTA),
      diarista: resolveAnnualLimitByWorkType(settings, WORK_TYPES.DIARISTA),
    };
    const limitApplied = resolveAnnualLimitByWorkType(settings, requestedWorkType);
    const allowZeroOrNegativeStockMovement =
      isStockMovementWithoutBalanceAllowed(settings);

    const withdrawnInYear = await prisma.uniformWithdrawal.count({
      where: {
        employeeId: employee.id,
        year,
        workType: requestedWorkType,
      },
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
        workType: requestedWorkType,
        limitsByWorkType,
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
    const { cpf, items, nonDeliveryJustification, notes, workType } = req.body;
    const normalizedWorkType = normalizeWorkType(workType);

    if (!cpf || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CPF e lista de itens são obrigatórios.",
      });
    }
    if (!normalizedWorkType) {
      return res.status(400).json({
        success: false,
        message: "Jornada inválida. Informe plantonista ou diarista.",
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
    const limitApplied = resolveAnnualLimitByWorkType(settings, normalizedWorkType);
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
      where: {
        employeeId: employee.id,
        year,
        workType: normalizedWorkType,
      },
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
    const stockRecords = await prisma.uniformStockSize.findMany({
      where: { id: { in: stockIds } },
      include: { item: true },
    });
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
          workType: normalizedWorkType,
          originType: WITHDRAWAL_ORIGIN_TYPES.SYSTEM,
          status,
          nonDeliveryJustification: nonDeliveryJustification || null,
          chargeReason,
          notes: notes || null,
        },
      });

      for (const item of items) {
        const stockId = Number(item.uniformStockSizeId);
        const quantity = 1;
        const stock = stockMap.get(stockId);
        const validadeMeses =
          normalizedWorkType === WORK_TYPES.PLANTONISTA
            ? Number(stock?.item?.validadePlantonistaMeses || 12)
            : Number(stock?.item?.validadeDiaristaMeses || 12);
        const dueDate =
          status === "EXEMPT" ? null : addMonthsSafely(now, validadeMeses);

        await tx.uniformWithdrawalItem.create({
          data: {
            uniformWithdrawalId: withdrawal.id,
            uniformStockSizeId: stockId,
            quantity,
            dueDate,
            expirationStatus: "ACTIVE",
            isChargeableExtra: status === "EXEMPT" ? 1 : 0,
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
            workType: normalizedWorkType,
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

// [MANUTENCAO] Motivo: registrar retiradas anteriores sem impactar o estoque atual.
// [MANUTENCAO] Impacto: gera cautela e pendência devolvível, mas não cria saída de estoque nem envia e-mail.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
export const createRetroactiveUniformWithdrawal = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const { cpf, items, nonDeliveryJustification, notes, workType, withdrawDate } =
      req.body;
    const normalizedWorkType = normalizeWorkType(workType);
    const retroactiveDate = parseRetroactiveWithdrawalDate(withdrawDate);

    if (!cpf || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "CPF e lista de itens são obrigatórios.",
      });
    }
    if (!normalizedWorkType) {
      return res.status(400).json({
        success: false,
        message: "Jornada inválida. Informe plantonista ou diarista.",
      });
    }
    if (!retroactiveDate) {
      return res.status(400).json({
        success: false,
        message: "Informe uma data válida para a retirada anterior.",
      });
    }
    if (!isBeforeToday(retroactiveDate)) {
      return res.status(400).json({
        success: false,
        message: "A data da retirada anterior deve ser menor que a data atual.",
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
    const limitApplied = resolveAnnualLimitByWorkType(settings, normalizedWorkType);
    const year = retroactiveDate.getFullYear();
    const now = new Date();
    const totalQuantity = items.length;

    if (totalQuantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "A retirada anterior deve conter ao menos um uniforme.",
      });
    }

    const withdrawnInYear = await prisma.uniformWithdrawal.count({
      where: {
        employeeId: employee.id,
        year,
        workType: normalizedWorkType,
      },
    });
    const willExceedLimit = withdrawnInYear + 1 > limitApplied;

    let status = "REGULAR";
    let chargeReason = null;
    if (willExceedLimit) {
      if (nonDeliveryJustification && nonDeliveryJustification.trim()) {
        status = "EXEMPT";
      } else {
        status = "CHARGEABLE";
        chargeReason = "Retirada anterior acima do limite anual sem justificativa.";
      }
    }

    const userId = req.user.id;
    const stockIds = items.map((item) => Number(item.uniformStockSizeId));
    const stockRecords = await prisma.uniformStockSize.findMany({
      where: { id: { in: stockIds } },
      include: { item: true },
    });
    const stockMap = new Map(stockRecords.map((s) => [s.id, s]));

    for (const item of items) {
      const stockId = Number(item.uniformStockSizeId);
      const quantity = 1;
      const stock = stockMap.get(stockId);
      if (!stock || quantity <= 0) {
        return res.status(400).json({
          success: false,
          message: "Item de estoque inválido na retirada anterior.",
        });
      }
      if (!stock.item || Number(stock.item.isUniform) !== 1 || Number(stock.item.active) !== 1) {
        return res.status(400).json({
          success: false,
          message: "A retirada anterior aceita apenas uniformes ativos.",
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      const withdrawal = await tx.uniformWithdrawal.create({
        data: {
          employeeId: employee.id,
          userId,
          year,
          withdrawDate: retroactiveDate,
          totalQuantity,
          limitApplied,
          workType: normalizedWorkType,
          originType: WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE,
          status,
          nonDeliveryJustification: nonDeliveryJustification || null,
          chargeReason,
          notes: notes || "Registro de retirada anterior ao lançamento no sistema.",
        },
      });

      for (const item of items) {
        const stockId = Number(item.uniformStockSizeId);
        const quantity = 1;
        const stock = stockMap.get(stockId);
        const validadeMeses =
          normalizedWorkType === WORK_TYPES.PLANTONISTA
            ? Number(stock?.item?.validadePlantonistaMeses || 12)
            : Number(stock?.item?.validadeDiaristaMeses || 12);
        const dueDate =
          status === "EXEMPT" ? null : addMonthsSafely(retroactiveDate, validadeMeses);

        await tx.uniformWithdrawalItem.create({
          data: {
            uniformWithdrawalId: withdrawal.id,
            uniformStockSizeId: stockId,
            quantity,
            dueDate,
            expirationStatus: "ACTIVE",
            isChargeableExtra: status === "EXEMPT" ? 1 : 0,
          },
        });
      }

      await tx.userLog.create({
        data: {
          userId,
          action: "UNIFORM_RETROACTIVE_WITHDRAWAL_CREATE",
          newData: {
            employeeId: employee.id,
            uniformWithdrawalId: withdrawal.id,
            totalQuantity,
            status,
            limitApplied,
            workType: normalizedWorkType,
            withdrawDate: retroactiveDate,
            originType: WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE,
          },
          createdAt: now,
        },
      });

      return withdrawal;
    });

    return res.status(201).json({
      success: true,
      message: "Registro de retirada anterior criado com sucesso.",
      data: result,
    });
  } catch (error) {
    console.error("Erro ao registrar retirada anterior de uniforme:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
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

    const shouldSendReturnEmail =
      withdrawal.originType !== WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE;

    if (!shouldSendReturnEmail) {
      // [MANUTENCAO] Motivo: retiradas anteriores são registros administrativos sem notificação por e-mail.
      // [MANUTENCAO] Impacto: a devolução segue baixando pendência e entrando no estoque de empréstimos, sem disparar e-mail.
      // [MANUTENCAO] Data: 2026-06-26
      // [MANUTENCAO] Autor: Márlon Etiene
      emailNotification = {
        success: true,
        message:
          "Devolução registrada sem envio de e-mail por se tratar de retirada anterior.",
        details: { employee: false, system: false },
      };
    } else {
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
        operationDate: now,
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
      // [MANUTENCAO] Motivo: explicar a devolução sem utilizar o termo técnico "legada".
      // [MANUTENCAO] Impacto: altera somente o texto do e-mail desta devolução específica.
      // [MANUTENCAO] Data: 2026-06-22
      // [MANUTENCAO] Autor: Márlon Etiene
      const textoEmail = `Olá ${employee?.name || "colaborador(a)"},

Foi registrada a devolução do uniforme informado abaixo.

A retirada deste uniforme não estava cadastrada no sistema. Por isso, a devolução foi registrada separadamente.

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
          "Comprovante de Devolução de Uniforme sem Retirada Registrada",
          textoEmail
        );
        emailNotification.details.employee = true;
      }

      if (emailCopiado) {
        await enviarEmail(
          emailCopiado,
          `Aviso de Devolução sem Retirada Registrada - ${employee?.name || "Colaborador"}`,
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
      if (withdrawalItem.chargedAt) {
        return res.status(400).json({
          success: false,
          message: `Item ${withdrawalItemId} já possui cobrança registrada.`,
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
          data: {
            discountedQuantity: { increment: quantity },
            chargedAt: now,
            chargedByUserId: userId,
            expirationStatus: "CHARGED",
          },
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

    // [MANUTENCAO] Motivo: disponibilizar filtro funcional "Em aberto" no relatório de retiradas de uniformes.
    // [MANUTENCAO] Impacto: OPEN agrupa retiradas ainda não encerradas, sem alterar os status gravados no banco.
    // [MANUTENCAO] Data: 2026-06-11
    // [MANUTENCAO] Autor: Márlon Etiene
    if (status === "OPEN") {
      where.status = { in: ["REGULAR", "EXEMPT", "CHARGEABLE", "PARTIAL_RETURN"] };
    } else if (status) {
      where.status = status;
    }
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

    // [MANUTENCAO] Motivo: relatório de retiradas deve exibir data/hora e responsável da devolução por item.
    // [MANUTENCAO] Impacto: usa movimentações já registradas, sem alterar estrutura do banco.
    // [MANUTENCAO] Data: 2026-06-16
    // [MANUTENCAO] Autor: Márlon Etiene
    const withdrawalIds = data.map((row) => row.id);
    const returnMovements = withdrawalIds.length
      ? await prisma.uniformMovement.findMany({
          where: {
            referenceType: "UniformWithdrawal",
            referenceId: { in: withdrawalIds },
            movementType: "RETURN_TO_LOAN",
          },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const latestReturnByWithdrawalItemId = new Map();
    returnMovements.forEach((movement) => {
      const itemId = extrairIdItemMovimentacao(movement.notes, "ItemRetirada");
      if (itemId && !latestReturnByWithdrawalItemId.has(itemId)) {
        latestReturnByWithdrawalItemId.set(itemId, {
          date: movement.createdAt,
          user: movement.user || null,
          quantity: Number(movement.quantity || 0),
        });
      }
    });
    const dataWithReturnInfo = data.map((withdrawal) => ({
      ...withdrawal,
      items: (withdrawal.items || []).map((item) => ({
        ...item,
        returnInfo: latestReturnByWithdrawalItemId.get(item.id) || null,
      })),
    }));

    return res.json({ success: true, data: dataWithReturnInfo });
  } catch (error) {
    console.error("Erro ao listar retiradas de uniformes:", error);
    return res.status(500).json({ success: false, message: error?.message || "Erro no servidor.", detail: error?.message || null });
  }
};

// [MANUTENCAO] Motivo: substituir a consulta baseada em planilha por consulta dos registros anteriores da Fase 1.
// [MANUTENCAO] Impacto: lista apenas retiradas com origem RETROACTIVE_WITHDRAWAL, sem depender de baseline importado.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
export const listRetroactiveUniformWithdrawals = async (req, res) => {
  try {
    const status = String(req.query?.status || "TODOS").toUpperCase();
    const referenceDate = new Date();
    referenceDate.setHours(0, 0, 0, 0);

    const withdrawals = await prisma.uniformWithdrawal.findMany({
      where: { originType: WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE },
      orderBy: { withdrawDate: "desc" },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            cpf: true,
            matricula: true,
            sector: true,
            position: true,
            active: true,
          },
        },
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

    const rows = withdrawals.flatMap((withdrawal) =>
      (withdrawal.items || []).map((item) => {
        const pendingQuantity = Math.max(getPendingQuantity(item), 0);
        const dueDate = item.dueDate || null;
        const vencido =
          pendingQuantity > 0 &&
          dueDate &&
          new Date(dueDate).setHours(0, 0, 0, 0) <= referenceDate.getTime();
        const devolvido =
          pendingQuantity <= 0 ||
          ["SETTLED_RETURN", "SETTLED_DISCOUNT"].includes(withdrawal.status);
        const situacao = devolvido ? "DEVOLVIDO" : vencido ? "VENCIDO" : "A_VENCER";

        return {
          id: `${withdrawal.id}-${item.id}`,
          withdrawalId: withdrawal.id,
          withdrawalItemId: item.id,
          employee: withdrawal.employee,
          operator: withdrawal.user,
          workType: withdrawal.workType,
          withdrawDate: withdrawal.withdrawDate,
          year: withdrawal.year,
          withdrawalStatus: withdrawal.status,
          originType: withdrawal.originType,
          uniformStockSizeId: item.uniformStockSizeId,
          uniformName: item.uniformStockSize?.item?.itemName || "-",
          size: item.uniformStockSize?.size || "-",
          quantity: Number(item.quantity || 0),
          returnedQuantity: Number(item.returnedQuantity || 0),
          discountedQuantity: Number(item.discountedQuantity || 0),
          pendingQuantity,
          dueDate,
          vencido: Boolean(vencido),
          situacao,
          notes: withdrawal.notes,
          createdAt: withdrawal.createdAt,
        };
      })
    );

    const filtered =
      status === "TODOS"
        ? rows
        : status === "NO_PRAZO" || status === "A_VENCER"
          ? rows.filter((row) => row.situacao === "A_VENCER")
          : status === "DEVOLVIDOS"
            ? rows.filter((row) => row.situacao === "DEVOLVIDO")
            : rows.filter((row) => row.situacao === "VENCIDO");

    return res.json({
      success: true,
      data: filtered,
      meta: {
        status,
        referenceDate,
        originType: WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE,
      },
    });
  } catch (error) {
    console.error("Erro ao listar retiradas anteriores de uniformes:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
  }
};

// [MANUTENCAO] Motivo: dashboard deve considerar cautelas abertas reais, sem depender de planilha histórica.
// [MANUTENCAO] Impacto: consolida retiradas normais e anteriores, ignorando cautelas devolvidas/baixadas.
// [MANUTENCAO] Data: 2026-06-26
// [MANUTENCAO] Autor: Márlon Etiene
export const listOpenUniformWithdrawalValiditySummary = async (req, res) => {
  try {
    const referenceDate = new Date();
    referenceDate.setHours(0, 0, 0, 0);

    const withdrawals = await prisma.uniformWithdrawal.findMany({
      where: {
        status: { in: ["REGULAR", "EXEMPT", "CHARGEABLE", "PARTIAL_RETURN"] },
        originType: {
          in: [
            WITHDRAWAL_ORIGIN_TYPES.SYSTEM,
            WITHDRAWAL_ORIGIN_TYPES.RETROACTIVE,
          ],
        },
      },
      orderBy: { withdrawDate: "desc" },
      select: {
        id: true,
        employeeId: true,
        withdrawDate: true,
        originType: true,
        status: true,
        employee: {
          select: {
            id: true,
            name: true,
            cpf: true,
            matricula: true,
            active: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            returnedQuantity: true,
            discountedQuantity: true,
            dueDate: true,
          },
        },
      },
    });

    const data = withdrawals
      .map((withdrawal) => {
        const pendingItems = (withdrawal.items || []).filter(
          (item) => Math.max(getPendingQuantity(item), 0) > 0
        );
        if (!pendingItems.length) return null;

        const dueDates = pendingItems
          .map((item) => (item.dueDate ? new Date(item.dueDate) : null))
          .filter((date) => date && !Number.isNaN(date.getTime()))
          .sort((left, right) => left.getTime() - right.getTime());
        const dueDate = dueDates[0] || null;
        const diasParaVencer = dueDate
          ? Math.ceil(
              (dueDate.setHours(0, 0, 0, 0) - referenceDate.getTime()) /
                (24 * 60 * 60 * 1000)
            )
          : 9999;
        const vencido = dueDate ? diasParaVencer <= 0 : false;

        return {
          id: withdrawal.id,
          employeeId: withdrawal.employeeId,
          employee: withdrawal.employee,
          withdrawDate: withdrawal.withdrawDate,
          originType: withdrawal.originType,
          status: withdrawal.status,
          expirationDate: dueDate,
          vencido,
          diasParaVencer,
          pendingItems: pendingItems.length,
          pendingQuantity: pendingItems.reduce(
            (acc, item) => acc + Math.max(getPendingQuantity(item), 0),
            0
          ),
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      data,
      meta: {
        referenceDate,
        source: "UNIFORM_WITHDRAWAL_OPEN_VALIDITY",
      },
    });
  } catch (error) {
    console.error("Erro ao listar validade de cautelas abertas:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
  }
};

export const listUniformExpirations = async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const {
      cpf,
      year,
      status,
      workType,
      expirationFilter = "DUE_60",
      startDate,
      endDate,
      customSituation = "ALL",
    } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereWithdrawal = {
      status: { in: ["REGULAR", "EXEMPT", "CHARGEABLE", "PARTIAL_RETURN"] },
    };

    if (status) whereWithdrawal.status = status;
    if (year) whereWithdrawal.year = Number(year);
    if (workType) whereWithdrawal.workType = String(workType).toUpperCase();

    if (cpf) {
      const employee = await prisma.employee.findUnique({
        where: { cpf: String(cpf).replace(/\D/g, "") },
        select: { id: true },
      });
      if (!employee) return res.json({ success: true, data: [] });
      whereWithdrawal.employeeId = employee.id;
    }

    const items = await prisma.uniformWithdrawalItem.findMany({
      where: {
        dueDate: { not: null },
        withdrawal: whereWithdrawal,
      },
      include: {
        withdrawal: {
          include: {
            employee: { select: { id: true, name: true, cpf: true } },
            user: { select: { id: true, name: true } },
          },
        },
        uniformStockSize: {
          include: { item: true },
        },
      },
      orderBy: { dueDate: "asc" },
    });

    const withPending = items
      .map((item) => {
        const pendingQuantity = Math.max(getPendingQuantity(item), 0);
        const due = item.dueDate ? new Date(item.dueDate) : null;
        return {
          ...item,
          pendingQuantity,
          dueDateObj: due,
        };
      })
      .filter((item) => item.pendingQuantity > 0 && item.dueDateObj);

    const parsedStart = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const parsedEnd = endDate ? new Date(`${endDate}T23:59:59`) : null;
    const due30 = new Date(today.getTime());
    due30.setDate(due30.getDate() + 30);
    const due60 = new Date(today.getTime());
    due60.setDate(due60.getDate() + 60);

    let filtered = withPending.filter((item) => {
      const due = item.dueDateObj;
      if (!due) return false;

      switch (String(expirationFilter || "DUE_60").toUpperCase()) {
        case "UPCOMING":
          return due >= today;
        case "DUE_30":
          return due >= today && due <= due30;
        case "DUE_60":
          return due >= today && due <= due60;
        case "OVERDUE":
          return due < today;
        case "CUSTOM":
          if (!parsedStart || !parsedEnd) return true;
          return due >= parsedStart && due <= parsedEnd;
        case "ALL":
        default:
          return true;
      }
    });

    // [MANUTENCAO] Motivo: aplicar regra de atraso consolidado por colaborador+uniforme.
    // [MANUTENCAO] Impacto: em OVERDUE, considera apenas o atraso mais atual, desconsiderando
    // atrasos anteriores quando houver retirada mais recente dentro da validade.
    // [MANUTENCAO] Data: 2026-05-29
    // [MANUTENCAO] Autor: Márlon Etiene
    if (String(expirationFilter || "").toUpperCase() === "OVERDUE") {
      const groups = new Map();
      filtered.forEach((item) => {
        const employeeId = Number(item.withdrawal?.employeeId || 0);
        const itemId = Number(item.uniformStockSize?.itemId || 0);
        const key = `${employeeId}:${itemId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(item);
      });

      const consolidated = [];
      groups.forEach((itemsInGroup) => {
        const sorted = [...itemsInGroup].sort((a, b) => {
          const aDate = new Date(a.withdrawal?.withdrawDate || 0).getTime();
          const bDate = new Date(b.withdrawal?.withdrawDate || 0).getTime();
          return bDate - aDate;
        });

        const validCurrentDelays = sorted.filter((candidate) => {
          const candidateWithdrawDate = new Date(
            candidate.withdrawal?.withdrawDate || 0
          );
          const candidateDueDate = candidate.dueDateObj;
          if (!candidateDueDate) return false;

          const hasNewerWithdrawalWithinValidity = sorted.some((other) => {
            if (other.id === candidate.id) return false;
            const otherWithdrawDate = new Date(other.withdrawal?.withdrawDate || 0);
            return (
              otherWithdrawDate > candidateWithdrawDate &&
              otherWithdrawDate <= candidateDueDate
            );
          });

          return !hasNewerWithdrawalWithinValidity;
        });

        if (validCurrentDelays.length > 0) {
          consolidated.push(validCurrentDelays[0]);
        }
      });

      filtered = consolidated.sort((a, b) => {
        const aDue = new Date(a.dueDateObj || 0).getTime();
        const bDue = new Date(b.dueDateObj || 0).getTime();
        return aDue - bDue;
      });
    }

    if (String(expirationFilter || "").toUpperCase() === "CUSTOM") {
      const customSituationNormalized = String(customSituation || "ALL").toUpperCase();
      filtered = filtered.filter((item) => {
        const due = item.dueDateObj;
        if (!due) return false;
        if (customSituationNormalized === "OVERDUE") return due < today;
        if (customSituationNormalized === "UPCOMING") return due >= today;
        return true;
      });
    }

    const data = filtered.map((item) => {
      const due = item.dueDateObj;
      const daysToExpire = due
        ? Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const normalizedFilter = String(expirationFilter || "").toUpperCase();
      return {
        id: item.id,
        withdrawalId: item.uniformWithdrawalId,
        withdrawalDate: item.withdrawal?.withdrawDate || null,
        dueDate: item.dueDate,
        daysToExpire,
        expirationStatus:
          daysToExpire !== null && daysToExpire < 0
            ? normalizedFilter === "OVERDUE"
              ? "ATRASO_ATUAL"
              : "VENCIDO"
            : "A_VENCER",
        pendingQuantity: item.pendingQuantity,
        quantity: Number(item.quantity || 0),
        returnedQuantity: Number(item.returnedQuantity || 0),
        discountedQuantity: Number(item.discountedQuantity || 0),
        employee: item.withdrawal?.employee || null,
        operator: item.withdrawal?.user || null,
        workType: item.withdrawal?.workType || null,
        withdrawalStatus: item.withdrawal?.status || null,
        uniformName: item.uniformStockSize?.item?.itemName || "-",
        uniformSize: item.uniformStockSize?.size || "-",
        itemUnitValue: getItemUnitValue(item.uniformStockSize?.item?.itemVal),
      };
    });

    return res.json({ success: true, data });
  } catch (error) {
    console.error("Erro ao listar vencimentos de uniformes:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
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

    // [MANUTENCAO] Motivo: relatório de empréstimos deve exibir data/hora e responsável da devolução por item.
    // [MANUTENCAO] Impacto: usa movimentações existentes; quando não houver id do item no histórico, associa por estoque/tamanho.
    // [MANUTENCAO] Data: 2026-06-16
    // [MANUTENCAO] Autor: Márlon Etiene
    const loanIds = data.map((row) => row.id);
    const returnMovements = loanIds.length
      ? await prisma.uniformMovement.findMany({
          where: {
            referenceType: "UniformLoan",
            referenceId: { in: loanIds },
            movementType: "LOAN_RETURN",
          },
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: "desc" },
        })
      : [];
    const latestReturnByLoanItemId = new Map();
    const latestReturnByLoanAndStock = new Map();
    returnMovements.forEach((movement) => {
      const itemId = extrairIdItemMovimentacao(movement.notes, "ItemEmprestimo");
      const info = {
        date: movement.createdAt,
        user: movement.user || null,
        quantity: Number(movement.quantity || 0),
      };
      if (itemId && !latestReturnByLoanItemId.has(itemId)) {
        latestReturnByLoanItemId.set(itemId, info);
      }
      const fallbackKey = `${movement.referenceId}:${movement.uniformStockSizeId}`;
      if (!latestReturnByLoanAndStock.has(fallbackKey)) {
        latestReturnByLoanAndStock.set(fallbackKey, info);
      }
    });
    const dataWithReturnInfo = data.map((loan) => ({
      ...loan,
      items: (loan.items || []).map((item) => ({
        ...item,
        returnInfo:
          latestReturnByLoanItemId.get(item.id) ||
          latestReturnByLoanAndStock.get(`${loan.id}:${item.uniformStockSizeId}`) ||
          null,
      })),
    }));

    return res.json({ success: true, data: dataWithReturnInfo });
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
            notes: `Devolução de empréstimo por colaborador. ItemEmprestimo=${loanItemId}.`,
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
        operationDate: now,
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






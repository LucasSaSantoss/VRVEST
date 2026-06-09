import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const PERFIL_SUPERVISOR = 4;
const SOURCE_IMPORTACAO_ROUPARIA = "IMPORTACAO_PLANILHA_ROUPARIA";

const requireSupervisor = (req, res) => {
  // [MANUTENCAO] Motivo: restringir importação de cautelas legadas à configuração administrativa do módulo.
  // [MANUTENCAO] Impacto: consulta permanece liberada para usuários autenticados, sem alterar fluxo oficial de retirada/devolução.
  // [MANUTENCAO] Data: 2026-06-08
  // [MANUTENCAO] Autor: Márlon Etiene
  const level = Number(req.user?.level || 0);
  if (level < PERFIL_SUPERVISOR) {
    res.status(403).json({
      success: false,
      message: "Acesso negado. Apenas supervisor pode importar cautelas legadas.",
    });
    return false;
  }
  return true;
};

const onlyDigits = (value) => String(value ?? "").replace(/\D/g, "");

const normalizeCpf = (value) => {
  const digits = onlyDigits(value);
  if (!digits) return { value: "", valid: false, reason: "CPF vazio." };
  if (digits.length > 11) {
    return {
      value: digits,
      valid: false,
      reason: "CPF inválido: possui mais de 11 dígitos.",
    };
  }
  return { value: digits.padStart(11, "0"), valid: true, reason: null };
};

const normalizeMatricula = (value) => String(value ?? "").trim().toUpperCase();

const parseExcelSerialDate = (serial) => {
  const numeric = Number(serial);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  const excelEpoch = Date.UTC(1899, 11, 30);
  const date = new Date(excelEpoch + Math.floor(numeric) * 24 * 60 * 60 * 1000);
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
};

const buildValidLocalDate = (year, month, day) => {
  const date = new Date(year, month - 1, day);
  if (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  ) {
    return date;
  }
  return null;
};

const parseDelimitedDate = (raw) => {
  const match = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2}|\d{4})$/);
  if (!match) return null;

  const first = Number(match[1]);
  const second = Number(match[2]);
  const year =
    match[3].length === 2 ? Number(`20${match[3]}`) : Number(match[3]);

  // [MANUTENCAO] Motivo: o XLSX converte datas seriais da planilha para texto m/d/aa.
  // [MANUTENCAO] Impacto: datas ambíguas como "6/2/24" passam a representar 02/06/2024, não 06/02/2024.
  // [MANUTENCAO] Data: 2026-06-08
  // [MANUTENCAO] Autor: Márlon Etiene
  if (match[3].length === 2) {
    const usDate = buildValidLocalDate(year, first, second);
    if (usDate) return usDate;
  }

  const brDate = buildValidLocalDate(year, second, first);
  if (brDate) return brDate;

  // [MANUTENCAO] Motivo: planilhas lidas pelo XLSX podem transformar datas reais do Excel em texto no formato m/d/aa.
  // [MANUTENCAO] Impacto: evita rejeitar cautelas válidas como "5/15/24", mantendo inválidos reais rejeitados.
  // [MANUTENCAO] Data: 2026-06-08
  // [MANUTENCAO] Autor: Márlon Etiene
  return buildValidLocalDate(year, first, second);
};

const parseLegacyDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }

  if (typeof value === "number") return parseExcelSerialDate(value);

  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (/^\d+(\.\d+)?$/.test(raw)) return parseExcelSerialDate(Number(raw));

  const delimitedDate = parseDelimitedDate(raw);
  if (delimitedDate) return delimitedDate;

  const isoMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    const year = Number(isoMatch[1]);
    const month = Number(isoMatch[2]);
    const day = Number(isoMatch[3]);
    return buildValidLocalDate(year, month, day);
  }

  return null;
};

const formatDateKey = (date) => {
  if (!date) return null;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const addMonthsToLocalDate = (date, months) =>
  new Date(date.getFullYear(), date.getMonth() + months, date.getDate());

const buildRejection = (row, motivo, acaoSugerida, cpfNormalizado = "") => ({
  linha: row?.rowNumber || "-",
  matriculaOriginal: row?.matricula || "",
  cpfOriginal: row?.cpf || "",
  cpfNormalizado,
  nomePlanilha: row?.nome || "",
  dataOriginal: row?.data || "",
  motivo,
  acaoSugerida,
});

const findEmployeeByMatricula = async (matricula) => {
  if (!matricula) return { employee: null, duplicated: false };
  const matches = await prisma.employee.findMany({
    where: { matricula },
    take: 2,
  });
  return { employee: matches[0] || null, duplicated: matches.length > 1 };
};

const resolveEmployee = async (row, cpfNormalizado) => {
  const matricula = normalizeMatricula(row.matricula);
  let employeeByCpf = null;
  let employeeByMatricula = null;
  let matriculaDuplicada = false;

  if (cpfNormalizado) {
    employeeByCpf = await prisma.employee.findUnique({
      where: { cpf: cpfNormalizado },
    });
  }

  if (matricula) {
    const matriculaResult = await findEmployeeByMatricula(matricula);
    employeeByMatricula = matriculaResult.employee;
    matriculaDuplicada = matriculaResult.duplicated;
  }

  if (employeeByCpf && employeeByMatricula && employeeByCpf.id !== employeeByMatricula.id) {
    return {
      employee: null,
      matchMethod: null,
      rejection: buildRejection(
        row,
        "CPF e matrícula apontam para colaboradores diferentes.",
        "Conferir CPF e matrícula na planilha.",
        cpfNormalizado
      ),
    };
  }

  if (employeeByCpf) {
    return { employee: employeeByCpf, matchMethod: matricula ? "CPF_MATRICULA" : "CPF" };
  }

  if (matriculaDuplicada) {
    return {
      employee: null,
      matchMethod: null,
      rejection: buildRejection(
        row,
        "Matrícula duplicada no cadastro de colaboradores.",
        "Validar matrícula no cadastro do sistema.",
        cpfNormalizado
      ),
    };
  }

  if (employeeByMatricula) {
    return { employee: employeeByMatricula, matchMethod: "MATRICULA" };
  }

  return {
    employee: null,
    matchMethod: null,
    rejection: buildRejection(
      row,
      "Colaborador não encontrado por CPF nem matrícula.",
      "Conferir CPF/matrícula ou cadastrar colaborador no sistema.",
      cpfNormalizado
    ),
  };
};

export const importLegacyUniformBaselines = async (req, res) => {
  if (!requireSupervisor(req, res)) return;

  try {
    const rows = Array.isArray(req.body?.rows) ? req.body.rows : [];
    if (!rows.length) {
      return res.status(400).json({
        success: false,
        message: "Nenhuma linha recebida para importação.",
      });
    }

    const rejeitados = [];
    const resultado = [];
    let criados = 0;
    let atualizados = 0;
    let semAlteracao = 0;

    for (const row of rows) {
      const cpfInfo = normalizeCpf(row.cpf);
      const dataUltimaRetirada = parseLegacyDate(row.data);

      if (!dataUltimaRetirada) {
        rejeitados.push(
          buildRejection(
            row,
            "Data vazia ou inválida.",
            "Informar data válida no formato dd/mm/aaaa.",
            cpfInfo.value
          )
        );
        continue;
      }

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (dataUltimaRetirada > today) {
        rejeitados.push(
          buildRejection(
            row,
            "Data futura não permitida.",
            "Conferir data da ultima cautela na planilha.",
            cpfInfo.value
          )
        );
        continue;
      }

      if (!cpfInfo.valid && onlyDigits(row.cpf).length > 11) {
        rejeitados.push(
          buildRejection(row, cpfInfo.reason, "Corrigir CPF na planilha.", cpfInfo.value)
        );
        continue;
      }

      const resolved = await resolveEmployee(row, cpfInfo.valid ? cpfInfo.value : "");
      if (!resolved.employee) {
        rejeitados.push(resolved.rejection);
        continue;
      }

      const existing = await prisma.uniformLegacyWithdrawalBaseline.findUnique({
        where: { employeeId: resolved.employee.id },
      });

      const newDateKey = formatDateKey(dataUltimaRetirada);
      const oldDateKey = formatDateKey(existing?.lastWithdrawalDate);

      if (!existing) {
        const created = await prisma.uniformLegacyWithdrawalBaseline.create({
          data: {
            employeeId: resolved.employee.id,
            lastWithdrawalDate: dataUltimaRetirada,
            source: SOURCE_IMPORTACAO_ROUPARIA,
          },
        });
        await prisma.userLog.create({
          data: {
            userId: Number(req.user?.id) || null,
            action: "UNIFORM_LEGACY_BASELINE_CREATE",
            newData: {
              employeeId: resolved.employee.id,
              lastWithdrawalDate: newDateKey,
              matchMethod: resolved.matchMethod,
              source: SOURCE_IMPORTACAO_ROUPARIA,
              baselineId: created.id,
            },
          },
        });
        criados += 1;
        resultado.push({
          linha: row.rowNumber,
          status: "CRIADO",
          employeeId: resolved.employee.id,
          colaborador: resolved.employee.name,
          cpf: resolved.employee.cpf,
          matricula: resolved.employee.matricula,
          dataAnterior: null,
          dataAtual: newDateKey,
          matchMethod: resolved.matchMethod,
        });
        continue;
      }

      if (oldDateKey === newDateKey) {
        semAlteracao += 1;
        resultado.push({
          linha: row.rowNumber,
          status: "SEM_ALTERACAO",
          employeeId: resolved.employee.id,
          colaborador: resolved.employee.name,
          cpf: resolved.employee.cpf,
          matricula: resolved.employee.matricula,
          dataAnterior: oldDateKey,
          dataAtual: newDateKey,
          matchMethod: resolved.matchMethod,
        });
        continue;
      }

      await prisma.uniformLegacyWithdrawalBaseline.update({
        where: { employeeId: resolved.employee.id },
        data: {
          lastWithdrawalDate: dataUltimaRetirada,
          source: SOURCE_IMPORTACAO_ROUPARIA,
        },
      });
      await prisma.userLog.create({
        data: {
          userId: Number(req.user?.id) || null,
          action: "UNIFORM_LEGACY_BASELINE_UPDATE",
          changes: {
            employeeId: resolved.employee.id,
            previousDate: oldDateKey,
            newDate: newDateKey,
            matchMethod: resolved.matchMethod,
            source: SOURCE_IMPORTACAO_ROUPARIA,
          },
        },
      });
      atualizados += 1;
      resultado.push({
        linha: row.rowNumber,
        status: "ATUALIZADO",
        employeeId: resolved.employee.id,
        colaborador: resolved.employee.name,
        cpf: resolved.employee.cpf,
        matricula: resolved.employee.matricula,
        dataAnterior: oldDateKey,
        dataAtual: newDateKey,
        matchMethod: resolved.matchMethod,
      });
    }

    return res.json({
      success: true,
      message: "Importação de cautelas legadas processada.",
      summary: {
        recebidos: rows.length,
        criados,
        atualizados,
        semAlteracao,
        rejeitados: rejeitados.length,
      },
      rejeitados,
      resultado,
    });
  } catch (error) {
    console.error("Erro ao importar cautelas legadas de uniformes:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
  }
};

export const listLegacyUniformBaselineAlerts = async (req, res) => {

  try {
    const status = String(req.query?.status || "TODOS").toUpperCase();
    const referenceDate = new Date();
    const cutoffDate = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - 6,
      referenceDate.getDate()
    );

    const data = await prisma.uniformLegacyWithdrawalBaseline.findMany({
      include: { employee: true },
      orderBy: { lastWithdrawalDate: "asc" },
    });

    const employeeIds = data.map((row) => row.employeeId);
    // [MANUTENCAO] Motivo: cautela legada deve ser cruzada com retiradas oficiais já registradas no sistema.
    // [MANUTENCAO] Impacto: consulta considera a data mais recente entre baseline importado e UniformWithdrawal.withdrawDate.
    // [MANUTENCAO] Data: 2026-06-08
    // [MANUTENCAO] Autor: Márlon Etiene
    const latestSystemWithdrawals = employeeIds.length
      ? await prisma.uniformWithdrawal.groupBy({
          by: ["employeeId"],
          where: { employeeId: { in: employeeIds } },
          _max: { withdrawDate: true },
        })
      : [];
    const latestSystemWithdrawalByEmployeeId = new Map(
      latestSystemWithdrawals.map((row) => [
        row.employeeId,
        row._max.withdrawDate || null,
      ])
    );

    const normalized = data.map((row) => {
      const legacyDate = row.lastWithdrawalDate;
      const systemDate = latestSystemWithdrawalByEmployeeId.get(row.employeeId) || null;
      const lastDate =
        systemDate && systemDate.getTime() > legacyDate.getTime()
          ? systemDate
          : legacyDate;
      const origemUltimaCautela =
        systemDate && systemDate.getTime() > legacyDate.getTime()
          ? "SISTEMA"
          : "LEGADO";
      const diffMs = referenceDate.getTime() - lastDate.getTime();
      const diasDesdeUltimaCautela = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      const vencimentoCautela = addMonthsToLocalDate(lastDate, 6);
      const diasParaVencer = Math.ceil(
        (vencimentoCautela.getTime() - referenceDate.getTime()) /
          (24 * 60 * 60 * 1000)
      );
      const vencido = vencimentoCautela <= referenceDate;
      return {
        id: row.id,
        employeeId: row.employeeId,
        lastWithdrawalDate: lastDate,
        expirationDate: vencimentoCautela,
        legacyLastWithdrawalDate: legacyDate,
        systemLastWithdrawalDate: systemDate,
        origemUltimaCautela,
        source: row.source,
        updatedAt: row.updatedAt,
        vencido,
        diasDesdeUltimaCautela,
        // [MANUTENCAO] Motivo: exibir prazo operacional com dias negativos quando a cautela já estiver vencida.
        // [MANUTENCAO] Impacto: adiciona campo calculado sem alterar a regra de vencimento de 6 meses.
        // [MANUTENCAO] Data: 2026-06-09
        // [MANUTENCAO] Autor: Márlon Etiene
        diasParaVencer,
        employee: {
          id: row.employee.id,
          name: row.employee.name,
          cpf: row.employee.cpf,
          matricula: row.employee.matricula,
          sector: row.employee.sector,
          position: row.employee.position,
          modality: row.employee.modality,
          active: row.employee.active,
        },
      };
    });

    // [MANUTENCAO] Motivo: permitir consulta padrão completa e filtro específico de cautelas ainda no prazo.
    // [MANUTENCAO] Impacto: mantém compatibilidade com VENCIDOS/TODOS e adiciona NO_PRAZO sem alterar cálculo de vencimento.
    // [MANUTENCAO] Data: 2026-06-08
    // [MANUTENCAO] Autor: Márlon Etiene
    const filtered =
      status === "TODOS"
        ? normalized
        : status === "NO_PRAZO"
          ? normalized.filter((row) => !row.vencido)
          : normalized.filter((row) => row.vencido);
    filtered.sort(
      (left, right) =>
        new Date(left.lastWithdrawalDate).getTime() -
        new Date(right.lastWithdrawalDate).getTime()
    );

    return res.json({
      success: true,
      data: filtered,
      meta: {
        referenceDate: formatDateKey(referenceDate),
        cutoffDate: formatDateKey(cutoffDate),
        status,
      },
    });
  } catch (error) {
    console.error("Erro ao listar alertas de cautelas legadas:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Erro no servidor.",
      detail: error?.message || null,
    });
  }
};

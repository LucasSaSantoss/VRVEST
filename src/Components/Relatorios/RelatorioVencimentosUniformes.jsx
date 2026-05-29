import { useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const FILTER_LABEL = {
  ALL: "Todos",
  UPCOMING: "A vencer",
  DUE_60: "Vence em até 60 dias",
  DUE_30: "Vence em até 30 dias",
  OVERDUE: "Vencidos",
  CUSTOM: "Período personalizado",
};

const WORK_TYPE_LABEL = {
  PLANTONISTA: "Plantonista",
  DIARISTA: "Diarista",
};

const WITHDRAWAL_STATUS_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Extra",
  CHARGEABLE: "Com cobrança",
  PARTIAL_RETURN: "Devolução parcial",
  SETTLED_RETURN: "Devolução total",
  SETTLED_DISCOUNT: "Baixa financeira",
};

const EXPIRATION_STATUS_LABEL = {
  A_VENCER: "A vencer",
  VENCIDO: "Vencido",
};

export default function RelatorioVencimentosUniformes() {
  const [cpf, setCpf] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [workType, setWorkType] = useState("");
  const [status, setStatus] = useState("");
  const [expirationFilter, setExpirationFilter] = useState("DUE_60");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const ITENS_POR_PAGINA = 10;

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {
        expirationFilter,
      };
      const cpfDigits = String(cpf || "").replace(/\D/g, "").trim();
      if (cpfDigits) params.cpf = cpfDigits;
      if (ano && String(ano).trim()) params.year = Number(ano);
      if (workType) params.workType = workType;
      if (status) params.status = status;
      if (expirationFilter === "CUSTOM" && startDate && endDate) {
        params.startDate = startDate;
        params.endDate = endDate;
      }

      const res = await api.get("/uniforms/reports/expirations", { params });
      if (res.data?.success) {
        setRows(res.data.data || []);
        setPaginaAtual(1);
      } else {
        setRows([]);
        setPaginaAtual(1);
      }
    } catch (error) {
      setRows([]);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar relatório de vencimentos."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    if (!rows.length) {
      showTemporaryPopup("Não há dados para exportar.", "error");
      return;
    }

    const linhas = rows.map((row) => ({
      "Retirada #": row.withdrawalId,
      "Data da retirada": row.withdrawalDate
        ? new Date(row.withdrawalDate).toLocaleString("pt-BR")
        : "-",
      Colaborador: row.employee?.name || "-",
      CPF: row.employee?.cpf || "-",
      Jornada: WORK_TYPE_LABEL[row.workType] || row.workType || "-",
      Uniforme: `${row.uniformName} (Tam ${row.uniformSize})`,
      "Qtd. Pendente": row.pendingQuantity,
      "Data de vencimento": row.dueDate
        ? new Date(row.dueDate).toLocaleDateString("pt-BR")
        : "-",
      "Dias para vencer": row.daysToExpire,
      Situação:
        EXPIRATION_STATUS_LABEL[row.expirationStatus] || row.expirationStatus || "-",
      "Status retirada":
        WITHDRAWAL_STATUS_LABEL[row.withdrawalStatus] || row.withdrawalStatus || "-",
      Operador: row.operator?.name || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Vencimentos");
    XLSX.writeFile(
      workbook,
      `relatorio_vencimentos_uniformes_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const totalPaginas = Math.max(1, Math.ceil(rows.length / ITENS_POR_PAGINA));
  const linhasPaginadas = rows.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Relatório de Vencimentos de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Consulta unificada de itens a vencer, vencidos e por período, com exportação Excel.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
            <input
              className="border rounded px-3 py-2 w-full"
              placeholder="Somente números"
              value={cpf}
              onChange={(e) => setCpf(String(e.target.value || "").replace(/\D/g, "").slice(0, 11))}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              placeholder="Ex.: 2026"
              value={ano}
              onChange={(e) => setAno(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jornada</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={workType}
              onChange={(e) => setWorkType(e.target.value)}
            >
              <option value="">Todas</option>
              <option value="PLANTONISTA">Plantonista</option>
              <option value="DIARISTA">Diarista</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status da retirada</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="">Todos</option>
              <option value="REGULAR">Retirada</option>
              <option value="EXEMPT">Extra</option>
              <option value="CHARGEABLE">Com cobrança</option>
              <option value="PARTIAL_RETURN">Devolução parcial</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Situação de vencimento</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={expirationFilter}
              onChange={(e) => setExpirationFilter(e.target.value)}
            >
              <option value="ALL">{FILTER_LABEL.ALL}</option>
              <option value="UPCOMING">{FILTER_LABEL.UPCOMING}</option>
              <option value="DUE_60">{FILTER_LABEL.DUE_60}</option>
              <option value="DUE_30">{FILTER_LABEL.DUE_30}</option>
              <option value="OVERDUE">{FILTER_LABEL.OVERDUE}</option>
              <option value="CUSTOM">{FILTER_LABEL.CUSTOM}</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={buscar}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-full"
            >
              {loading ? "Buscando..." : "Buscar"}
            </button>
          </div>
          {expirationFilter === "CUSTOM" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Início do período</label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 w-full"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fim do período</label>
                <input
                  type="date"
                  className="border rounded px-3 py-2 w-full"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
        <div className="mt-2">
          <button
            onClick={exportarExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded"
          >
            Exportar Excel
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Resultados</h3>
        {loading ? (
          <p className="text-sm text-gray-600">Carregando...</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Retirada #</th>
                  <th className="py-2 pr-3">Data da Retirada</th>
                  <th className="py-2 pr-3">Colaborador</th>
                  <th className="py-2 pr-3">CPF</th>
                  <th className="py-2 pr-3">Jornada</th>
                  <th className="py-2 pr-3">Uniforme</th>
                  <th className="py-2 pr-3">Qtd. Pendente</th>
                  <th className="py-2 pr-3">Vencimento</th>
                  <th className="py-2 pr-3">Dias</th>
                  <th className="py-2 pr-3">Situação</th>
                  <th className="py-2">Operador</th>
                </tr>
              </thead>
              <tbody>
                {linhasPaginadas.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="py-2 pr-3 font-semibold">#{row.withdrawalId}</td>
                    <td className="py-2 pr-3">
                      {row.withdrawalDate
                        ? new Date(row.withdrawalDate).toLocaleString("pt-BR")
                        : "-"}
                    </td>
                    <td className="py-2 pr-3">{row.employee?.name || "-"}</td>
                    <td className="py-2 pr-3">{row.employee?.cpf || "-"}</td>
                    <td className="py-2 pr-3">{WORK_TYPE_LABEL[row.workType] || row.workType || "-"}</td>
                    <td className="py-2 pr-3">{row.uniformName} (Tam {row.uniformSize})</td>
                    <td className="py-2 pr-3 font-semibold">{row.pendingQuantity}</td>
                    <td className="py-2 pr-3">
                      {row.dueDate ? new Date(row.dueDate).toLocaleDateString("pt-BR") : "-"}
                    </td>
                    <td className="py-2 pr-3">{row.daysToExpire}</td>
                    <td className="py-2 pr-3">
                      {EXPIRATION_STATUS_LABEL[row.expirationStatus] || row.expirationStatus || "-"}
                    </td>
                    <td className="py-2">{row.operator?.name || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
              <span>Página {paginaAtual} de {totalPaginas}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {popup.show && (
        <div
          className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${
            popup.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const normalizarBusca = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s]/g, "")
    .toUpperCase()
    .trim();

const limitarTexto = (value, limit = 25) => {
  const text = String(value ?? "");
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
};

const calcularDataVencimento = (value) => {
  if (!value) return null;
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return null;
  const vencimento = new Date(data);
  vencimento.setMonth(vencimento.getMonth() + 6);
  return vencimento;
};

const formatarDataPtBr = (value) => {
  const data = value instanceof Date ? value : new Date(value);
  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-BR");
};

const exportJsonToExcel = (rows, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

export default function CautelasLegadasUniformes() {
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [termoBusca, setTermoBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const loadAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const res = await api.get("/uniforms/legacy-baselines/alerts", {
        params: { status: statusFiltro },
      });
      if (res.data?.success) {
        setAlerts(res.data.data || []);
        setPaginaAtual(1);
      } else {
        setAlerts([]);
      }
    } catch (error) {
      setAlerts([]);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar cautelas históricas."),
        "error"
      );
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, [statusFiltro]);

  const linhasAlerta = useMemo(
    () =>
      alerts.map((row) => {
        const dataVencimento = calcularDataVencimento(row.lastWithdrawalDate);

        return {
          Matrícula: row.employee?.matricula || "-",
          Colaborador: row.employee?.name || "-",
          CPF: row.employee?.cpf || "-",
          Setor: row.employee?.sector || "-",
          Cargo: row.employee?.position || "-",
          "Última cautela": row.lastWithdrawalDate ? formatarDataPtBr(row.lastWithdrawalDate) : "-",
          Origem: row.origemUltimaCautela === "SISTEMA" ? "Sistema" : "Histórico",
          Vencimento: dataVencimento ? formatarDataPtBr(dataVencimento) : "-",
          Status: row.vencido ? "Vencido" : "A vencer",
          Ativo: Number(row.employee?.active || 0) === 1 ? "Sim" : "Não",
        };
      }),
    [alerts]
  );

  const linhasFiltradas = useMemo(() => {
    const termo = normalizarBusca(termoBusca);
    if (!termo) return linhasAlerta;

    return linhasAlerta.filter((row) =>
      [row.Matrícula, row.CPF, row.Colaborador].some((value) =>
        normalizarBusca(value).includes(termo)
      )
    );
  }, [linhasAlerta, termoBusca]);

  const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const fimPagina = inicioPagina + itensPorPagina;
  const linhasPaginadas = linhasFiltradas.slice(inicioPagina, fimPagina);

  const exportarAlertas = () => {
    if (!linhasFiltradas.length) {
      showTemporaryPopup("Não há alertas para exportar.", "error");
      return;
    }
    exportJsonToExcel(
      linhasFiltradas,
      "Cautelas Históricas",
      `alertas_cautelas_historicas_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const handleItensPorPagina = (event) => {
    setItensPorPagina(Number(event.target.value));
    setPaginaAtual(1);
  };

  const handleTermoBuscaChange = (event) => {
    setTermoBusca(event.target.value);
    setPaginaAtual(1);
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Consulta de Cautelas Históricas</h2>
        <p className="text-gray-600 text-sm">
          Consulte colaboradores cuja última cautela histórica de uniforme está vencida há 6 meses ou mais.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-700">Consulta de Cautelas</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:items-start">
            <input
              type="text"
              className="border rounded px-3 py-1.5 h-9 text-sm min-w-[260px]"
              value={termoBusca}
              onChange={handleTermoBuscaChange}
              placeholder="Buscar por matrícula, CPF ou nome"
            />
            <select
              className="border rounded px-3 py-1.5 h-9 text-sm"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="NO_PRAZO">À vencer</option>
            </select>
            <button
              type="button"
              onClick={loadAlerts}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 h-9 rounded text-sm"
            >
              {loadingAlerts ? "Buscando..." : "Atualizar"}
            </button>
            <button
              type="button"
              onClick={exportarAlertas}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 h-9 rounded text-sm whitespace-nowrap"
            >
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-3 text-sm text-gray-600">
          <span>
            {linhasFiltradas.length
              ? `Exibindo ${inicioPagina + 1} a ${Math.min(fimPagina, linhasFiltradas.length)} de ${linhasFiltradas.length} registro(s).`
              : ""}
          </span>
          <label className="flex items-center gap-2">
            Registros por página
            <select
              className="border rounded px-2 py-1"
              value={itensPorPagina}
              onChange={handleItensPorPagina}
            >
              {PAGE_SIZE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loadingAlerts ? (
          <p className="text-sm text-gray-600">Carregando...</p>
        ) : linhasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Matrícula</th>
                    <th className="py-2 pr-3">Colaborador</th>
                    <th className="py-2 pr-3">CPF</th>
                    <th className="py-2 pr-3">Cargo</th>
                    <th className="py-2 pr-3">Última cautela</th>
                    <th className="py-2 pr-3">Origem</th>
                    <th className="py-2 pr-3">Vencimento</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasPaginadas.map((row) => (
                    <tr key={`${row.CPF}-${row["Última cautela"]}`} className="border-b">
                      <td className="py-2 pr-3">{row.Matrícula}</td>
                      <td className="py-2 pr-3">{row.Colaborador}</td>
                      <td className="py-2 pr-3">{row.CPF}</td>
                      <td className="py-2 pr-3" title={row.Cargo}>
                        {limitarTexto(row.Cargo)}
                      </td>
                      <td className="py-2 pr-3">{row["Última cautela"]}</td>
                      <td className="py-2 pr-3">{row.Origem}</td>
                      <td
                        className={`py-2 pr-3 font-semibold ${
                          row.Status === "Vencido" ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {row.Vencimento}
                      </td>
                      <td className="py-2">{row.Status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mt-4">
              <span className="text-sm text-gray-600">
                Página {paginaSegura} de {totalPaginas}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={paginaSegura === 1}
                  onClick={() => setPaginaAtual(1)}
                  className="border rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                >
                  Primeiro
                </button>
                <button
                  type="button"
                  disabled={paginaSegura === 1}
                  onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                  className="border rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <button
                  type="button"
                  disabled={paginaSegura === totalPaginas}
                  onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                  className="border rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                >
                  Próxima
                </button>
                <button
                  type="button"
                  disabled={paginaSegura === totalPaginas}
                  onClick={() => setPaginaAtual(totalPaginas)}
                  className="border rounded px-3 py-1.5 disabled:opacity-40 hover:bg-gray-50"
                >
                  Último
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {popup.show && (
        <div
          className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${
            popup.type === "success"
              ? "bg-green-600"
              : popup.type === "info"
                ? "bg-blue-600"
                : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}

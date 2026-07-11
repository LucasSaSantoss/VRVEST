import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const STATUS_LABELS = {
  A_VENCER: "A vencer",
  VENCIDO: "Vencido",
  DEVOLVIDO: "Devolvido",
};

const WORK_TYPE_LABELS = {
  PLANTONISTA: "Plantonista",
  DIARISTA: "Diarista",
};

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

const formatarDataPtBr = (value) => {
  const data = new Date(value);
  return Number.isNaN(data.getTime()) ? "-" : data.toLocaleDateString("pt-BR");
};

const exportJsonToExcel = (rows, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

export default function CautelasLegadasUniformes() {
  const [loading, setLoading] = useState(false);
  const [registros, setRegistros] = useState([]);
  const [statusFiltro, setStatusFiltro] = useState("TODOS");
  const [termoBusca, setTermoBusca] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const loadRegistros = async () => {
    setLoading(true);
    try {
      const res = await api.get("/uniforms/withdrawals/retroactive", {
        params: { status: statusFiltro },
      });
      if (res.data?.success) {
        setRegistros(res.data.data || []);
        setPaginaAtual(1);
      } else {
        setRegistros([]);
      }
    } catch (error) {
      setRegistros([]);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar retiradas anteriores."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRegistros();
  }, [statusFiltro]);

  const linhasConsulta = useMemo(
    () =>
      registros.map((row) => ({
        id: row.id,
        retirada: `#${row.withdrawalId}`,
        Matrícula: row.employee?.matricula || "-",
        Colaborador: row.employee?.name || "-",
        CPF: row.employee?.cpf || "-",
        Cargo: row.employee?.position || "-",
        Jornada: WORK_TYPE_LABELS[row.workType] || row.workType || "-",
        "Data da retirada": formatarDataPtBr(row.withdrawDate),
        Uniforme: row.uniformName || "-",
        Tamanho: row.size || "-",
        Quantidade: Number(row.quantity || 0),
        Devolvida: Number(row.returnedQuantity || 0),
        Pendente: Number(row.pendingQuantity || 0),
        Vencimento: row.dueDate ? formatarDataPtBr(row.dueDate) : "-",
        Situação: STATUS_LABELS[row.situacao] || row.situacao || "-",
        Responsável: row.operator?.name || "-",
      })),
    [registros]
  );

  const linhasFiltradas = useMemo(() => {
    const termo = normalizarBusca(termoBusca);
    if (!termo) return linhasConsulta;

    return linhasConsulta.filter((row) =>
      [row.Matrícula, row.CPF, row.Colaborador, row.Uniforme, row.retirada].some((value) =>
        normalizarBusca(value).includes(termo)
      )
    );
  }, [linhasConsulta, termoBusca]);

  const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicioPagina = (paginaSegura - 1) * itensPorPagina;
  const fimPagina = inicioPagina + itensPorPagina;
  const linhasPaginadas = linhasFiltradas.slice(inicioPagina, fimPagina);

  const exportarRegistros = () => {
    if (!linhasFiltradas.length) {
      showTemporaryPopup("Não há registros para exportar.", "error");
      return;
    }
    exportJsonToExcel(
      linhasFiltradas.map(({ id, ...row }) => row),
      "Retiradas Anteriores",
      `retiradas_anteriores_${new Date().toISOString().slice(0, 10)}.xlsx`
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
        <h2 className="text-xl font-bold text-gray-800">Consulta de Retiradas Anteriores</h2>
        <p className="text-gray-600 text-sm">
          Consulte os uniformes registrados manualmente pela rotina de retirada anterior.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-3">
          <div>
            <h3 className="font-semibold text-gray-700">Registros anteriores</h3>
          </div>
          <div className="flex flex-col md:flex-row gap-2 md:items-start">
            <input
              type="text"
              className="border rounded px-3 py-1.5 h-9 text-sm min-w-[260px]"
              value={termoBusca}
              onChange={handleTermoBuscaChange}
              placeholder="Buscar por matrícula, CPF, nome ou uniforme"
            />
            <select
              className="border rounded px-3 py-1.5 h-9 text-sm"
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="VENCIDOS">Vencidos</option>
              <option value="NO_PRAZO">A vencer</option>
              <option value="DEVOLVIDOS">Devolvidos</option>
            </select>
            <button
              type="button"
              onClick={loadRegistros}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 h-9 rounded text-sm"
            >
              {loading ? "Buscando..." : "Atualizar"}
            </button>
            <button
              type="button"
              onClick={exportarRegistros}
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

        {loading ? (
          <p className="text-sm text-gray-600">Carregando...</p>
        ) : linhasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro encontrado.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left">
                    <th className="py-2 pr-3">Retirada</th>
                    <th className="py-2 pr-3">Matrícula</th>
                    <th className="py-2 pr-3">Colaborador</th>
                    <th className="py-2 pr-3">CPF</th>
                    <th className="py-2 pr-3">Jornada</th>
                    <th className="py-2 pr-3">Data</th>
                    <th className="py-2 pr-3">Uniforme</th>
                    <th className="py-2 pr-3">Tam.</th>
                    <th className="py-2 pr-3 text-right">Qtd.</th>
                    <th className="py-2 pr-3 text-right">Pendente</th>
                    <th className="py-2 pr-3">Vencimento</th>
                    <th className="py-2">Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {linhasPaginadas.map((row) => (
                    <tr key={row.id} className="border-b">
                      <td className="py-2 pr-3">{row.retirada}</td>
                      <td className="py-2 pr-3">{row.Matrícula}</td>
                      <td className="py-2 pr-3">{row.Colaborador}</td>
                      <td className="py-2 pr-3">{row.CPF}</td>
                      <td className="py-2 pr-3">{row.Jornada}</td>
                      <td className="py-2 pr-3">{row["Data da retirada"]}</td>
                      <td className="py-2 pr-3" title={row.Uniforme}>
                        {limitarTexto(row.Uniforme, 30)}
                      </td>
                      <td className="py-2 pr-3">{row.Tamanho}</td>
                      <td className="py-2 pr-3 text-right">{row.Quantidade}</td>
                      <td className="py-2 pr-3 text-right">{row.Pendente}</td>
                      <td
                        className={`py-2 pr-3 font-semibold ${
                          row.Situação === "Vencido" ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {row.Vencimento}
                      </td>
                      <td className="py-2">{row.Situação}</td>
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

import { useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const ITENS_POR_PAGINA = 10;

const STATUS_LABEL = {
  OPEN: "Em aberto",
  PARTIAL_RETURN: "Devolução parcial",
  SETTLED_RETURN: "Devolução total",
};

const formatStatus = (status) => STATUS_LABEL[status] || status || "-";

const formatDateTime = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
};

const getReturnDate = (item) =>
  Number(item?.returnedQuantity || 0) > 0 ? formatDateTime(item?.returnInfo?.date) : "-";

const getReturnUser = (item) =>
  Number(item?.returnedQuantity || 0) > 0 ? item?.returnInfo?.user?.name || "-" : "-";

export default function RelatorioEmprestimosUniformes() {
  const [cpf, setCpf] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const buscar = async () => {
    setLoading(true);
    try {
      const params = {};
      const cpfDigits = String(cpf || "").replace(/\D/g, "").trim();
      if (cpfDigits) params.cpf = cpfDigits;
      if (ano && String(ano).trim()) params.year = Number(ano);
      if (status) params.status = status;

      const res = await api.get("/uniforms/loans", { params });
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
        obterMensagemErroApi(error, "Erro ao carregar relatório de empréstimos."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const linhasTabela = rows.flatMap((loan) => {
    const itens = loan.items || [];
    if (!itens.length) {
      return [
        {
          key: `loan-${loan.id}`,
          ordem: `Empréstimo #${loan.id}`,
          dataRetirada: formatDateTime(loan.loanDate),
          colaborador: loan.employee?.name || "-",
          cpf: loan.employee?.cpf || "-",
          uniforme: "-",
          qtdRetirada: 0,
          responsavelRetirada: loan.user?.name || "-",
          qtdDevolvida: 0,
          dataDevolucao: "-",
          responsavelDevolucao: "-",
          status: formatStatus(loan.status),
        },
      ];
    }

    return itens.map((item, itemIndex) => ({
      key: `loan-${loan.id}-item-${item.id || itemIndex}`,
      ordem: `Empréstimo #${loan.id}`,
      dataRetirada: formatDateTime(loan.loanDate),
      colaborador: loan.employee?.name || "-",
      cpf: loan.employee?.cpf || "-",
      uniforme: `${item.uniformStockSize?.item?.itemName || "Item"} (Tam ${
        item.uniformStockSize?.size || "-"
      })`,
      qtdRetirada: Number(item.quantity || 0),
      responsavelRetirada: loan.user?.name || "-",
      qtdDevolvida: Number(item.returnedQuantity || 0),
      dataDevolucao: getReturnDate(item),
      responsavelDevolucao: getReturnUser(item),
      status: formatStatus(loan.status),
    }));
  });

  const totalPaginas = Math.max(1, Math.ceil(linhasTabela.length / ITENS_POR_PAGINA));
  const linhasPaginadas = linhasTabela.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const exportarExcel = () => {
    if (!linhasTabela.length) {
      showTemporaryPopup("Não há dados para exportar.", "error");
      return;
    }

    const linhas = linhasTabela.map((linha) => ({
      Ordem: linha.ordem,
      "Data/Hora Retirada": linha.dataRetirada,
      Colaborador: linha.colaborador,
      CPF: linha.cpf,
      Uniforme: linha.uniforme,
      Qtd: linha.qtdRetirada,
      "Responsável Retirada": linha.responsavelRetirada,
      "Qtd. Devolvida": linha.qtdDevolvida,
      "Data/Hora Devolução": linha.dataDevolucao,
      "Responsável Devolução": linha.responsavelDevolucao,
      Status: linha.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Emprestimos");
    XLSX.writeFile(
      workbook,
      `relatorio_emprestimos_uniformes_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Relatório de Empréstimos de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Consulta de empréstimos e devoluções por colaborador, item, responsável e data/hora.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="CPF (somente números)"
            value={cpf}
            onChange={(e) => setCpf(String(e.target.value || "").replace(/\D/g, "").slice(0, 11))}
          />
          <input
            type="number"
            className="border rounded px-3 py-2"
            placeholder="Ano"
            value={ano}
            onChange={(e) => setAno(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="OPEN">Em aberto</option>
            <option value="PARTIAL_RETURN">Devolução parcial</option>
            <option value="SETTLED_RETURN">Devolução total</option>
          </select>
          <button
            onClick={buscar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
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
                  <th className="py-2 pr-3">Ordem</th>
                  <th className="py-2 pr-3">Data/Hora Retirada</th>
                  <th className="py-2 pr-3">Colaborador</th>
                  <th className="py-2 pr-3">CPF</th>
                  <th className="py-2 pr-3">Uniforme</th>
                  <th className="py-2 pr-3">Qtd</th>
                  <th className="py-2 pr-3">Responsável Retirada</th>
                  <th className="py-2 pr-3">Qtd. Devolvida</th>
                  <th className="py-2 pr-3">Data/Hora Devolução</th>
                  <th className="py-2 pr-3">Responsável Devolução</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {linhasPaginadas.map((linha) => (
                  <tr key={linha.key} className="border-b align-top">
                    <td className="py-2 pr-3 font-semibold">{linha.ordem}</td>
                    <td className="py-2 pr-3">{linha.dataRetirada}</td>
                    <td className="py-2 pr-3">{linha.colaborador}</td>
                    <td className="py-2 pr-3">{linha.cpf}</td>
                    <td className="py-2 pr-3">{linha.uniforme}</td>
                    <td className="py-2 pr-3 font-semibold">{linha.qtdRetirada}</td>
                    <td className="py-2 pr-3">{linha.responsavelRetirada}</td>
                    <td className="py-2 pr-3 font-semibold">{linha.qtdDevolvida}</td>
                    <td className="py-2 pr-3">{linha.dataDevolucao}</td>
                    <td className="py-2 pr-3">{linha.responsavelDevolucao}</td>
                    <td className="py-2">{linha.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
              <span>Página {paginaAtual} de {totalPaginas}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Primeiro
                </button>
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
                <button
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual >= totalPaginas}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Último
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

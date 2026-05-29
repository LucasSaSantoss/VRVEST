import { useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const STATUS_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Extra",
  CHARGEABLE: "Com Cobrança",
  PARTIAL_RETURN: "Devolução Parcial",
  SETTLED_RETURN: "Devolução Total",
  SETTLED_DISCOUNT: "Baixa Financeira",
};

const formatStatus = (status) => STATUS_LABEL[status] || status || "-";

export default function RelatorioRetiradasUniformes() {
  const [cpf, setCpf] = useState("");
  const [ano, setAno] = useState(String(new Date().getFullYear()));
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [agrupamento, setAgrupamento] = useState("none");
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
      const params = {};
      const cpfDigits = String(cpf || "").replace(/\D/g, "").trim();
      if (cpfDigits) params.cpf = cpfDigits;
      if (ano && String(ano).trim()) params.year = Number(ano);
      if (status) params.status = status;

      const res = await api.get("/uniforms/withdrawals", { params });
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
        obterMensagemErroApi(error, "Erro ao carregar relatório de retiradas."),
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

    const linhas = [];
    rows.forEach((w) => {
      const itens = w.items || [];

      if (!itens.length) {
        linhas.push({
          Ordem: `Retirada #${w.id}`,
          "Data/Hora": new Date(w.withdrawDate).toLocaleString("pt-BR"),
          Colaborador: w.employee?.name || "-",
          CPF: w.employee?.cpf || "-",
          Uniforme: "-",
          "Qtd. Retirada": Number(w.totalQuantity || 0),
          "Qtd. Devolvida": 0,
          Status: formatStatus(w.status),
          Operador: w.user?.name || "-",
        });
        return;
      }

      itens.forEach((item) => {
        linhas.push({
          Ordem: `Retirada #${w.id}`,
          "Data/Hora": new Date(w.withdrawDate).toLocaleString("pt-BR"),
          Colaborador: w.employee?.name || "-",
          CPF: w.employee?.cpf || "-",
          Uniforme: `${item.uniformStockSize?.item?.itemName || "Item"} (Tam ${
            item.uniformStockSize?.size || "-"
          })`,
          "Qtd. Retirada": Number(item.quantity || 0),
          "Qtd. Devolvida": Number(item.returnedQuantity || 0),
          Status: formatStatus(w.status),
          Operador: w.user?.name || "-",
        });
      });
    });

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Retiradas");
    XLSX.writeFile(
      workbook,
      `relatorio_retiradas_uniformes_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  const linhasTabela = rows.flatMap((w) => {
    const itens = w.items || [];
    if (!itens.length) {
      return [
        {
          key: `withdrawal-${w.id}`,
          ordem: `Retirada #${w.id}`,
          dataHora: new Date(w.withdrawDate).toLocaleString("pt-BR"),
          colaborador: w.employee?.name || "-",
          cpf: w.employee?.cpf || "-",
          uniforme: "-",
          qtdRetirada: Number(w.totalQuantity || 0),
          qtdDevolvida: 0,
          status: formatStatus(w.status),
          operador: w.user?.name || "-",
        },
      ];
    }
    return itens.map((item, itemIndex) => ({
      key: `withdrawal-${w.id}-item-${item.id || itemIndex}`,
      ordem: `Retirada #${w.id}`,
      dataHora: new Date(w.withdrawDate).toLocaleString("pt-BR"),
      colaborador: w.employee?.name || "-",
      cpf: w.employee?.cpf || "-",
      uniforme: `${item.uniformStockSize?.item?.itemName || "Item"} (Tam ${item.uniformStockSize?.size || "-"})`,
      qtdRetirada: Number(item.quantity || 0),
      qtdDevolvida: Number(item.returnedQuantity || 0),
      status: formatStatus(w.status),
      operador: w.user?.name || "-",
    }));
  });

  const totalPaginas = Math.max(1, Math.ceil(linhasTabela.length / ITENS_POR_PAGINA));
  const linhasPaginadas = linhasTabela.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const linhasAgrupadas = (() => {
    if (agrupamento === "none") return linhasPaginadas;

    const source = linhasTabela;
    const groupedRows = [];
    const groupedMap = new Map();

    source.forEach((linha) => {
      const groupLabel =
        agrupamento === "date"
          ? String(linha.dataHora || "-").split(",")[0]
          : `${linha.colaborador} (${linha.cpf})`;
      if (!groupedMap.has(groupLabel)) groupedMap.set(groupLabel, []);
      groupedMap.get(groupLabel).push(linha);
    });

    groupedMap.forEach((items, groupLabel) => {
      groupedRows.push({
        isGroupHeader: true,
        key: `group-${agrupamento}-${groupLabel}`,
        groupLabel,
      });
      items.forEach((item) => groupedRows.push(item));
    });

    return groupedRows;
  })();

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Relatório de Retiradas de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Consulta de quem retirou, o que retirou, quantidade e data/hora da retirada.
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
            <option value="REGULAR">Retirada</option>
            <option value="EXEMPT">Extra</option>
            <option value="CHARGEABLE">Com Cobrança</option>
            <option value="PARTIAL_RETURN">Devolução Parcial</option>
            <option value="SETTLED_RETURN">Devolução Total</option>
            <option value="SETTLED_DISCOUNT">Baixa Financeira</option>
          </select>
          <button
            onClick={buscar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
          <select
            className="border rounded px-3 py-2"
            value={agrupamento}
            onChange={(e) => setAgrupamento(e.target.value)}
          >
            <option value="none">Agrupamento: Nenhum</option>
            <option value="date">Agrupar por Data</option>
            <option value="employee">Agrupar por Colaborador</option>
          </select>
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
                  <th className="py-2 pr-3">Data/Hora</th>
                  <th className="py-2 pr-3">Colaborador</th>
                  <th className="py-2 pr-3">CPF</th>
                  <th className="py-2 pr-3">Uniforme</th>
                  <th className="py-2 pr-3">Qtd. Retirada</th>
                  <th className="py-2 pr-3">Qtd. Devolvida</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Operador</th>
                </tr>
              </thead>
              <tbody>
                {linhasAgrupadas.map((linha) =>
                  linha?.isGroupHeader ? (
                    <tr key={linha.key} className="bg-gray-100">
                      <td colSpan={9} className="py-2 px-2 font-semibold text-gray-700">
                        {linha.groupLabel}
                      </td>
                    </tr>
                  ) : (
                    <tr key={linha.key} className="border-b align-top">
                      <td className="py-2 pr-3 font-semibold">{linha.ordem}</td>
                      <td className="py-2 pr-3">{linha.dataHora}</td>
                      <td className="py-2 pr-3">{linha.colaborador}</td>
                      <td className="py-2 pr-3">{linha.cpf}</td>
                      <td className="py-2 pr-3">{linha.uniforme}</td>
                      <td className="py-2 pr-3 font-semibold">{linha.qtdRetirada}</td>
                      <td className="py-2 pr-3 font-semibold">{linha.qtdDevolvida}</td>
                      <td className="py-2 pr-3">{linha.status}</td>
                      <td className="py-2">{linha.operador}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
            {agrupamento === "none" && (
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
            )}
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

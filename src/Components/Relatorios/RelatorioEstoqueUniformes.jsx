import { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import { api, carregarRelatorioEstoqueUniformes, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const ITENS_POR_PAGINA = 10;
const DEFAULT_SIZE_CODES = ["P", "M", "G", "GG", "XXG", "EXG", "G1"];

const STATUS_SALDO_LABEL = {
  OK: "Normal",
  BAIXO: "Abaixo do Mínimo",
  ZERADO: "Zerado",
  NEGATIVO: "Negativo",
};

const calcularStatusSaldo = (saldoTotal, estoqueMinimo) => {
  if (saldoTotal < 0) return "NEGATIVO";
  if (saldoTotal === 0) return "ZERADO";
  if (saldoTotal < estoqueMinimo) return "BAIXO";
  return "OK";
};

export default function RelatorioEstoqueUniformes() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [sizeCatalog, setSizeCatalog] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const [filtroNome, setFiltroNome] = useState("");
  const [filtroTamanho, setFiltroTamanho] = useState("");
  const [filtroStatusSaldo, setFiltroStatusSaldo] = useState("");
  const [somenteAbaixoMinimo, setSomenteAbaixoMinimo] = useState(false);
  const [somenteAtivos, setSomenteAtivos] = useState(true);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const carregarCatalogoTamanhos = async () => {
    try {
      const catalogRes = await api.get("/uniform-stock/sizes-catalog");
      if (catalogRes?.data?.success) {
        const apiCatalog = catalogRes.data.data || [];
        setSizeCatalog(
          apiCatalog.length > 0
            ? apiCatalog.map((size) => String(size.code || "").trim().toUpperCase())
            : DEFAULT_SIZE_CODES
        );
      } else {
        setSizeCatalog(DEFAULT_SIZE_CODES);
      }
    } catch (_error) {
      setSizeCatalog(DEFAULT_SIZE_CODES);
    }
  };

  useEffect(() => {
    // [MANUTENCAO] Motivo: carregar lista de tamanhos ao abrir a tela, sem depender do botão buscar.
    // [MANUTENCAO] Impacto: filtro de tamanho fica disponível imediatamente para o usuário.
    // [MANUTENCAO] Data: 2026-06-01
    // [MANUTENCAO] Autor: Márlon Etiene
    carregarCatalogoTamanhos();
  }, []);

  const buscar = async () => {
    setLoading(true);
    try {
      const response = await carregarRelatorioEstoqueUniformes();
      if (!response?.success) {
        setRows([]);
        setPaginaAtual(1);
        showTemporaryPopup(response?.message || "Erro ao carregar relatório de estoque.", "error");
        return;
      }

      const normalized = (response.data || []).map((row) => {
        const estoquePrincipal = Number(row.qtyMainStock || 0);
        const estoqueEmprestimo = Number(row.qtyLoanStock || 0);
        const estoqueMinimo =
          Number(row.minStock || 0) > 0
            ? Number(row.minStock || 0)
            : Number(row.item?.minStock || 0);
        const saldoTotal = estoquePrincipal + estoqueEmprestimo;
        const statusSaldo = calcularStatusSaldo(saldoTotal, estoqueMinimo);
        return {
          id: row.id,
          itemId: row.itemId,
          itemNome: row.item?.itemName || "-",
          tamanho: row.size || "-",
          ativo: Number(row.item?.active || 0) === 1,
          estoquePrincipal,
          estoqueEmprestimo,
          saldoTotal,
          estoqueMinimo,
          statusSaldo,
          atualizadoEm: row.updatedAt || null,
        };
      });

      setRows(normalized);
      setPaginaAtual(1);
    } catch (error) {
      setRows([]);
      setPaginaAtual(1);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar relatório de estoque."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const linhasFiltradas = useMemo(() => {
    return rows.filter((row) => {
      if (somenteAtivos && !row.ativo) return false;

      if (filtroNome.trim()) {
        const nome = String(row.itemNome || "").toLowerCase();
        if (!nome.includes(filtroNome.trim().toLowerCase())) return false;
      }

      if (filtroTamanho && row.tamanho !== filtroTamanho) return false;

      if (filtroStatusSaldo && row.statusSaldo !== filtroStatusSaldo) return false;

      if (somenteAbaixoMinimo && !(row.saldoTotal < row.estoqueMinimo)) return false;

      return true;
    });
  }, [rows, filtroNome, filtroTamanho, filtroStatusSaldo, somenteAbaixoMinimo, somenteAtivos]);

  const tamanhosDisponiveis = useMemo(() => {
    return [...new Set(sizeCatalog.map((size) => String(size || "").trim().toUpperCase()).filter(Boolean))];
  }, [sizeCatalog]);

  const totalPaginas = Math.max(1, Math.ceil(linhasFiltradas.length / ITENS_POR_PAGINA));
  const linhasPaginadas = linhasFiltradas.slice(
    (paginaAtual - 1) * ITENS_POR_PAGINA,
    paginaAtual * ITENS_POR_PAGINA
  );

  const exportarExcel = () => {
    if (!linhasFiltradas.length) {
      showTemporaryPopup("Não há dados para exportar.", "error");
      return;
    }

    const linhas = linhasFiltradas.map((row) => ({
      "Item ID": row.itemId,
      Uniforme: row.itemNome,
      Tamanho: row.tamanho,
      "Estoque Principal": row.estoquePrincipal,
      "Estoque Empréstimos": row.estoqueEmprestimo,
      "Saldo Total": row.saldoTotal,
      "Estoque Mínimo": row.estoqueMinimo,
      "Status do Saldo": STATUS_SALDO_LABEL[row.statusSaldo] || row.statusSaldo,
      Ativo: row.ativo ? "Sim" : "Não",
      "Atualizado em": row.atualizadoEm
        ? new Date(row.atualizadoEm).toLocaleString("pt-BR")
        : "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(linhas);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque Uniformes");
    XLSX.writeFile(
      workbook,
      `relatorio_estoque_uniformes_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Relatório de Estoque de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Consulta completa do estoque principal e de empréstimos, com filtros e exportação Excel.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="Buscar por nome do uniforme"
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
          />
          <select
            className="border rounded px-3 py-2"
            value={filtroTamanho}
            onChange={(e) => setFiltroTamanho(e.target.value)}
          >
            <option value="">Todos os tamanhos</option>
            {tamanhosDisponiveis.map((tamanho) => (
              <option key={tamanho} value={tamanho}>
                {tamanho}
              </option>
            ))}
          </select>
          <select
            className="border rounded px-3 py-2"
            value={filtroStatusSaldo}
            onChange={(e) => setFiltroStatusSaldo(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="OK">Normal</option>
            <option value="BAIXO">Abaixo do mínimo</option>
            <option value="ZERADO">Zerado</option>
            <option value="NEGATIVO">Negativo</option>
          </select>
          <button
            onClick={buscar}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            {loading ? "Buscando..." : "Buscar"}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={somenteAbaixoMinimo}
              onChange={(e) => setSomenteAbaixoMinimo(e.target.checked)}
            />
            Somente abaixo do mínimo
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={somenteAtivos}
              onChange={(e) => setSomenteAtivos(e.target.checked)}
            />
            Somente itens ativos
          </label>
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
        ) : linhasFiltradas.length === 0 ? (
          <p className="text-sm text-gray-600">Nenhum registro encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2 pr-3">Uniforme</th>
                  <th className="py-2 pr-3">Tamanho</th>
                  <th className="py-2 pr-3">Principal</th>
                  <th className="py-2 pr-3">Empréstimos</th>
                  <th className="py-2 pr-3">Saldo Total</th>
                  <th className="py-2 pr-3">Mínimo</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3">Ativo</th>
                  <th className="py-2">Atualizado em</th>
                </tr>
              </thead>
              <tbody>
                {linhasPaginadas.map((row) => (
                  <tr key={row.id} className="border-b align-top">
                    <td className="py-2 pr-3">{row.itemNome}</td>
                    <td className="py-2 pr-3">{row.tamanho}</td>
                    <td className="py-2 pr-3 font-semibold">{row.estoquePrincipal}</td>
                    <td className="py-2 pr-3 font-semibold">{row.estoqueEmprestimo}</td>
                    <td className="py-2 pr-3 font-semibold">{row.saldoTotal}</td>
                    <td className="py-2 pr-3">{row.estoqueMinimo}</td>
                    <td className="py-2 pr-3">
                      {STATUS_SALDO_LABEL[row.statusSaldo] || row.statusSaldo}
                    </td>
                    <td className="py-2 pr-3">{row.ativo ? "Sim" : "Não"}</td>
                    <td className="py-2">
                      {row.atualizadoEm
                        ? new Date(row.atualizadoEm).toLocaleString("pt-BR")
                        : "-"}
                    </td>
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


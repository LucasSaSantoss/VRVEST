import { useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const STATUS_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Isenta",
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

      const res = await api.get("/uniforms/withdrawals", { params });
      if (res.data?.success) {
        setRows(res.data.data || []);
      } else {
        setRows([]);
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
            <option value="EXEMPT">Isenta</option>
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
                {rows.map((w) => {
                  const itens = w.items || [];
                  if (itens.length === 0) {
                    return (
                      <tr key={`withdrawal-${w.id}`} className="border-b align-top">
                        <td className="py-2 pr-3 font-semibold">Retirada #{w.id}</td>
                        <td className="py-2 pr-3">{new Date(w.withdrawDate).toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-3">{w.employee?.name || "-"}</td>
                        <td className="py-2 pr-3">{w.employee?.cpf || "-"}</td>
                        <td className="py-2 pr-3">-</td>
                        <td className="py-2 pr-3 font-semibold">{w.totalQuantity || 0}</td>
                        <td className="py-2 pr-3 font-semibold">0</td>
                        <td className="py-2 pr-3">{formatStatus(w.status)}</td>
                        <td className="py-2">{w.user?.name || "-"}</td>
                      </tr>
                    );
                  }

                  return itens.map((item, itemIndex) => {
                    const itemLabel = `${item.uniformStockSize?.item?.itemName || "Item"} (Tam ${
                      item.uniformStockSize?.size || "-"
                    })`;
                    const qtdRetirada = Number(item.quantity || 0);
                    const qtdDevolvida = Number(item.returnedQuantity || 0);

                    return (
                      <tr key={`withdrawal-${w.id}-item-${item.id || itemIndex}`} className="border-b align-top">
                        <td className="py-2 pr-3 font-semibold">Retirada #{w.id}</td>
                        <td className="py-2 pr-3">{new Date(w.withdrawDate).toLocaleString("pt-BR")}</td>
                        <td className="py-2 pr-3">{w.employee?.name || "-"}</td>
                        <td className="py-2 pr-3">{w.employee?.cpf || "-"}</td>
                        <td className="py-2 pr-3">{itemLabel}</td>
                        <td className="py-2 pr-3 font-semibold">{qtdRetirada}</td>
                        <td className="py-2 pr-3 font-semibold">{qtdDevolvida}</td>
                        <td className="py-2 pr-3">{formatStatus(w.status)}</td>
                        <td className="py-2">{w.user?.name || "-"}</td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
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


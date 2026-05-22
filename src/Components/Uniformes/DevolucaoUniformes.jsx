import { useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const STATUS_RETIRADA_LABEL = {
  OPEN: "Aberta",
  PARTIAL_RETURN: "Devolução Parcial",
  RETURNED: "Devolução Total",
  CHARGEABLE: "Com Cobrança",
  EXEMPT: "Isenta",
  SETTLED_DISCOUNT: "Baixa Financeira",
  SETTLED_RETURN: "Devolução Total",
  REGULAR: "Retirada",
};

export default function DevolucaoUniformes() {
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [returnQtyMap, setReturnQtyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [lastAutoCpfSearched, setLastAutoCpfSearched] = useState("");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const formatarStatusRetirada = (status) =>
    STATUS_RETIRADA_LABEL[status] || status || "-";

  const carregarRetiradasEmAberto = async (cpfValue) => {
    const cpfBusca = String(cpfValue ?? cpf).trim();
    if (!cpfBusca) {
      showTemporaryPopup("Informe o CPF do colaborador.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/uniforms/employee/${cpfBusca}/summary`);
      if (res.data?.success) {
        setSummary(res.data.data);
        setReturnQtyMap({});
      }
    } catch (error) {
      setSummary(null);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar retiradas em aberto."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11 && cpfDigits !== lastAutoCpfSearched) {
      setLastAutoCpfSearched(cpfDigits);
      carregarRetiradasEmAberto(cpfDigits);
    }
  }, [cpf, lastAutoCpfSearched]);

  const registrarDevolucao = async (withdrawal) => {
    const payloadItems = withdrawal.items
      .map((item) => ({
        uniformWithdrawalItemId: item.id,
        quantity: Number(returnQtyMap[item.id] || 0),
      }))
      .filter((entry) => entry.quantity > 0);

    if (payloadItems.length === 0) {
      showTemporaryPopup("Informe ao menos uma quantidade para devolução.", "error");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(`/uniforms/withdrawals/${withdrawal.id}/return`, {
        items: payloadItems,
      });
      if (res.data?.success) {
        const emailNotification = res.data?.emailNotification;
        if (emailNotification?.success === false) {
          showTemporaryPopup(
            `${res.data?.message || "Devolução registrada com sucesso."} ${emailNotification.message || ""}`.trim(),
            "error"
          );
        } else {
          showTemporaryPopup(
            `${res.data?.message || "Devolução registrada com sucesso."} ${emailNotification?.message || ""}`.trim(),
            "success"
          );
        }
        await carregarRetiradasEmAberto(summary?.employee?.cpf || cpf);
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar devolução."),
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Devolução de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Consulta por CPF e recebimento de itens pendentes de devolução.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Buscar Colaborador</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="CPF (somente números)"
            value={cpf}
            onChange={(e) => {
              const digits = String(e.target.value || "")
                .replace(/\D/g, "")
                .slice(0, 11);
              setCpf(digits);
              if (digits.length < 11) {
                setLastAutoCpfSearched("");
              }
            }}
          />
          <button
            onClick={() => carregarRetiradasEmAberto(cpf)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            {loading ? "Buscando..." : "Buscar CPF"}
          </button>
        </div>
      </section>

      {summary && (
        <section className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Retiradas em Aberto</h3>
          <p className="text-sm mb-3">
            <strong>Colaborador:</strong> {summary.employee?.name} ({summary.employee?.cpf})
          </p>

          {(summary.openWithdrawals || []).length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma retirada pendente para este colaborador.</p>
          ) : (
            <div className="space-y-4">
              {summary.openWithdrawals.map((w) => (
                <div key={w.id} className="border rounded-lg p-3">
                  <div className="flex flex-wrap gap-3 text-sm mb-2">
                    <span><strong>Retirada:</strong> #{w.id}</span>
                    <span><strong>Data:</strong> {new Date(w.withdrawDate).toLocaleString("pt-BR")}</span>
                    <span><strong>Status:</strong> {formatarStatusRetirada(w.status)}</span>
                  </div>

                  <div className="space-y-2 mb-2">
                    {w.items.map((item) => (
                      <div
                        key={item.id}
                        className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-gray-50 rounded p-2 text-sm"
                      >
                        <span className="md:col-span-2">
                          {item.uniformStockSize?.item?.itemName} - Tam {item.uniformStockSize?.size}
                        </span>
                        <span>Pendente: {item.pendingQuantity}</span>
                        <input
                          type="number"
                          min="0"
                          max={item.pendingQuantity}
                          className="border rounded px-2 py-1"
                          placeholder="Qtd devolver"
                          value={returnQtyMap[item.id] || ""}
                          onChange={(e) =>
                            setReturnQtyMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => registrarDevolucao(w)}
                    disabled={processing}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-3 py-2 rounded"
                  >
                    {processing ? "Aguarde..." : "Registrar Devolução"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {popup.show && (
        <div
          className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${
            popup.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 z-[65] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow px-5 py-4 text-sm font-semibold text-gray-700">
            Aguarde... processando devolução e envio de e-mail.
          </div>
        </div>
      )}
    </div>
  );
}

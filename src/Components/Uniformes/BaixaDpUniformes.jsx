import { useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

export default function BaixaDpUniformes() {
  const [cpf, setCpf] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [discountQtyMap, setDiscountQtyMap] = useState({});
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [lastAutoCpfSearched, setLastAutoCpfSearched] = useState("");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const buscarPendencias = async (cpfValue) => {
    const cpfBusca = String(cpfValue ?? cpf).trim();
    if (!cpfBusca) {
      showTemporaryPopup("Informe o CPF do colaborador.", "error");
      return;
    }
    setLoading(true);
    try {
      const res = await api.get(`/uniforms/dp/employee/${cpfBusca}/pendencies`);
      if (res.data?.success) {
        const data = res.data.data;
        setResult(data);
        const defaultQtyMap = {};
        (data.withdrawals || []).forEach((withdrawal) => {
          (withdrawal.items || []).forEach((item) => {
            defaultQtyMap[item.id] = Number(item.pendingQuantity || 0);
          });
        });
        setDiscountQtyMap(defaultQtyMap);
      }
    } catch (error) {
      setResult(null);
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao carregar pendências do DP."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11 && cpfDigits !== lastAutoCpfSearched) {
      setLastAutoCpfSearched(cpfDigits);
      buscarPendencias(cpfDigits);
    }
  }, [cpf, lastAutoCpfSearched]);

  const confirmarBaixaItem = async (withdrawal, item) => {
    const quantidadeInformada = Number(discountQtyMap[item.id] || 0);
    if (!Number.isFinite(quantidadeInformada) || quantidadeInformada <= 0) {
      showTemporaryPopup("Informe uma quantidade válida para desconto.", "error");
      return;
    }

    if (quantidadeInformada > Number(item.pendingQuantity || 0)) {
      showTemporaryPopup("A quantidade não pode ser maior que o pendente do item.", "error");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.put(`/uniforms/withdrawals/${withdrawal.id}/settlement`, {
        items: [
          {
            uniformWithdrawalItemId: item.id,
            quantity: quantidadeInformada,
          },
        ],
      });
      if (res.data?.success) {
        const emailNotification = res.data?.emailNotification;
        if (emailNotification?.success === false) {
          showTemporaryPopup(
            `${res.data.message || "Baixa financeira registrada."} ${emailNotification.message || ""}`.trim(),
            "error"
          );
        } else {
          showTemporaryPopup(
            `${res.data.message || "Baixa financeira registrada."} ${emailNotification?.message || ""}`.trim(),
            "success"
          );
        }
        await buscarPendencias();
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao registrar baixa financeira."), "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Baixa de Uniformes - DP</h2>
        <p className="text-gray-600 text-sm">Consulta por CPF e baixa financeira com valor de desconto.</p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Buscar Pendências</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="CPF"
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
          <button onClick={() => buscarPendencias()} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">{loading ? "Buscando..." : "Buscar"}</button>
        </div>
      </section>

      {result && (
        <section className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Pendências Ativas</h3>
          <p className="text-sm mb-3"><strong>Colaborador:</strong> {result.employee?.name} ({result.employee?.cpf})</p>

          {result.withdrawals.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma pendência ativa.</p>
          ) : (
            <div className="space-y-4">
              {result.withdrawals.map((w) => (
                <div key={w.id} className="border rounded p-3">
                  <div className="flex flex-wrap gap-3 text-sm mb-2">
                    <span><strong>Retirada:</strong> #{w.id}</span>
                    <span><strong>Data:</strong> {new Date(w.withdrawDate).toLocaleString("pt-BR")}</span>
                    <span><strong>Valor pendente:</strong> R$ {w.totalPendingValue.toFixed(2)}</span>
                  </div>

                  <div className="space-y-2 mb-2">
                    {w.items.map((item) => (
                      <div key={item.id} className="grid grid-cols-1 md:grid-cols-8 gap-2 items-center bg-gray-50 rounded p-2 text-sm">
                        <span className="md:col-span-2">{item.uniformStockSize?.item?.itemName} - Tam {item.uniformStockSize?.size}</span>
                        <span>Pendente: {item.pendingQuantity}</span>
                        <span>Unitário: R$ {Number(item.unitValue || 0).toFixed(2)}</span>
                        <span>Subtotal: R$ {Number(item.pendingValue || 0).toFixed(2)}</span>
                        <span className={`text-xs font-semibold ${item.chargedAt ? "text-red-700" : "text-emerald-700"}`}>
                          {item.chargedAt ? "Já cobrado" : "Cobrança pendente"}
                        </span>
                        <input
                          type="number"
                          min="0"
                          max={item.pendingQuantity}
                          className="border rounded px-2 py-1 md:max-w-[110px]"
                          placeholder="Qtd desconto"
                          value={discountQtyMap[item.id] || ""}
                          disabled={Boolean(item.chargedAt)}
                          onChange={(e) => setDiscountQtyMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        />
                        <button
                          disabled={processing || Boolean(item.chargedAt)}
                          onClick={() => confirmarBaixaItem(w, item)}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold px-3 py-1.5 rounded md:justify-self-start"
                        >
                          {item.chargedAt ? "Cobrado" : processing ? "Aguarde..." : "Confirmar Baixa"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {popup.show && (
        <div className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${popup.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {popup.message}
        </div>
      )}

      {processing && (
        <div className="fixed inset-0 z-[65] bg-black/30 flex items-center justify-center">
          <div className="bg-white rounded-lg shadow px-5 py-4 text-sm font-semibold text-gray-700">
            Aguarde... processando baixa financeira e envio de e-mail.
          </div>
        </div>
      )}
    </div>
  );
}


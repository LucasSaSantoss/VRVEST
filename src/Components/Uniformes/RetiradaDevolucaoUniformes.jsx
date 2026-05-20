import { useEffect, useMemo, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";
import { LuPlus } from "react-icons/lu";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const STATUS_RETIRADA_LABEL = {
  OPEN: "Aberta",
  PARTIAL_RETURN: "Devolução Parcial",
  RETURNED: "Devolvida",
  CHARGEABLE: "Com Cobrança",
  EXEMPT: "Isenta",
  SETTLED: "Baixa Financeira Concluída",
};

export default function RetiradaDevolucaoUniformes() {
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [justificativaExcedente, setJustificativaExcedente] = useState("");
  const [observacoesRetirada, setObservacoesRetirada] = useState("");
  const [cart, setCart] = useState([]);
  const [returnQtyMap, setReturnQtyMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [lastAutoCpfSearched, setLastAutoCpfSearched] = useState("");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const loadStockOptions = async () => {
    try {
      const res = await api.get("/uniforms/stock-options");
      if (res.data?.success) setStockOptions(res.data.data || []);
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar opções de uniforme."),
        "error"
      );
    }
  };

  useEffect(() => {
    loadStockOptions();
  }, []);

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11 && cpfDigits !== lastAutoCpfSearched) {
      setLastAutoCpfSearched(cpfDigits);
      loadSummary(cpfDigits);
    }
  }, [cpf, lastAutoCpfSearched]);

  const loadSummary = async (cpfValue) => {
    if (!cpfValue?.trim()) {
      showTemporaryPopup("Informe o CPF para buscar o colaborador.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/uniforms/employee/${cpfValue.trim()}/summary`);
      if (res.data?.success) {
        setSummary(res.data.data);
        showTemporaryPopup("Resumo do colaborador carregado.", "success");
      }
    } catch (error) {
      setSummary(null);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar resumo do colaborador."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const stockMap = useMemo(() => {
    const map = new Map();
    stockOptions.forEach((item) => map.set(String(item.id), item));
    return map;
  }, [stockOptions]);

  const productOptions = useMemo(() => {
    const map = new Map();
    stockOptions.forEach((s) => {
      const key = String(s.itemId);
      if (!map.has(key)) {
        map.set(key, {
          itemId: s.itemId,
          itemName: s.item?.itemName || "Item",
        });
      }
    });
    return Array.from(map.values());
  }, [stockOptions]);

  const sizeOptionsByProduct = useMemo(
    () =>
      stockOptions.filter(
        (s) => String(s.itemId) === String(selectedItemId)
      ),
    [stockOptions, selectedItemId]
  );

  const cartTotalQuantity = useMemo(
    () => cart.reduce((acc, item) => acc + Number(item.quantity || 0), 0),
    [cart]
  );

  const willExceedLimit = useMemo(() => {
    if (!summary) return false;
    const alreadyWithdrawn = Number(summary.withdrawnInYear || 0);
    const annualLimit = Number(summary.limitApplied || 0);
    return alreadyWithdrawn + cartTotalQuantity > annualLimit;
  }, [summary, cartTotalQuantity]);

  const handleAddToCart = () => {
    const stockId = String(selectedStockId);
    const qty = 1;
    if (!stockId || qty <= 0) {
      showTemporaryPopup("Selecione item/tamanho e quantidade válida.", "error");
      return;
    }

    const selected = stockMap.get(stockId);
    if (!selected) {
      showTemporaryPopup("Item inválido.", "error");
      return;
    }

    const alreadyInCartByProduct = cart.some(
      (c) => String(c.itemId) === String(selected.itemId)
    );
    if (alreadyInCartByProduct) {
      showTemporaryPopup(
        "Este uniforme já foi adicionado. Não é permitido repetir o mesmo uniforme na retirada.",
        "error"
      );
      return;
    }

    if (Number(selected.qtyMainStock) < 1) {
      showTemporaryPopup("Sem saldo disponível para este tamanho.", "error");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        itemId: Number(selected.itemId),
        uniformStockSizeId: Number(stockId),
        quantity: 1,
        label: `${selected.item?.itemName || "Item"} - Tam ${selected.size}`,
      },
    ]);
  };

  const removeFromCart = (uniformStockSizeId) => {
    setCart((prev) => prev.filter((c) => c.uniformStockSizeId !== uniformStockSizeId));
  };

  const handleCreateWithdrawal = async () => {
    if (!summary?.employee?.cpf) {
      showTemporaryPopup("Busque o colaborador antes de registrar retirada.", "error");
      return;
    }
    if (cart.length === 0) {
      showTemporaryPopup("Adicione ao menos um item no carrinho.", "error");
      return;
    }
    if (willExceedLimit && !justificativaExcedente.trim()) {
      showTemporaryPopup(
        "Justificativa obrigatória quando o limite anual for excedido.",
        "error"
      );
      return;
    }

    try {
      const res = await api.post("/uniforms/withdraw", {
        cpf: summary.employee.cpf,
        items: cart,
        nonDeliveryJustification: justificativaExcedente?.trim() || null,
        notes: observacoesRetirada?.trim() || null,
      });

      if (res.data?.success) {
        showTemporaryPopup("Retirada registrada com sucesso.", "success");
        setCart([]);
        setSelectedItemId("");
        setSelectedStockId("");
        setJustificativaExcedente("");
        setObservacoesRetirada("");
        await loadStockOptions();
        await loadSummary(summary.employee.cpf);
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar retirada."),
        "error"
      );
    }
  };

  const handleReturnItems = async (withdrawal) => {
    const payloadItems = withdrawal.items
      .map((item) => {
        const qty = Number(returnQtyMap[item.id] || 0);
        return {
          uniformWithdrawalItemId: item.id,
          quantity: qty,
        };
      })
      .filter((i) => i.quantity > 0);

    if (payloadItems.length === 0) {
      showTemporaryPopup("Informe ao menos uma quantidade para devolução.", "error");
      return;
    }

    try {
      const res = await api.post(`/uniforms/withdrawals/${withdrawal.id}/return`, {
        items: payloadItems,
      });

      if (res.data?.success) {
        showTemporaryPopup("Devolução registrada com sucesso.", "success");
        setReturnQtyMap({});
        await loadSummary(summary.employee.cpf);
        await loadStockOptions();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar devolução."),
        "error"
      );
    }
  };


  const formatarStatusRetirada = (status) =>
    STATUS_RETIRADA_LABEL[status] || status || "-";

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Retirada e Devolução de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Busca por CPF, retirada com múltiplos itens, devolução parcial e baixa financeira.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Consulta de Colaborador</h3>
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
            onClick={() => loadSummary(cpf)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            {loading ? "Buscando..." : "Buscar CPF"}
          </button>
        </div>
      </section>

      {summary && (
        <>
          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Resumo do Colaborador</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
              <div><strong>Nome:</strong> {summary.employee?.name}</div>
              <div><strong>CPF:</strong> {summary.employee?.cpf}</div>
              <div><strong>Limite anual:</strong> {summary.limitApplied}</div>
              <div><strong>Retiradas no ano:</strong> {summary.withdrawnInYear}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Nova Retirada</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <select
                className="border rounded px-3 py-2"
                value={selectedItemId}
                onChange={(e) => {
                  setSelectedItemId(e.target.value);
                  setSelectedStockId("");
                }}
              >
                <option value="">Selecione o uniforme/produto</option>
                {productOptions.map((p) => (
                  <option key={p.itemId} value={p.itemId}>
                    {p.itemName}
                  </option>
                ))}
              </select>
              <select
                className="border rounded px-3 py-2"
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                disabled={!selectedItemId}
              >
                <option value="">
                  {selectedItemId
                    ? "Selecione o tamanho"
                    : "..."}
                </option>
                {sizeOptionsByProduct.map((s) => (
                  <option key={s.id} value={s.id}>
                    Tam {s.size} (Saldo: {s.qtyMainStock})
                  </option>
                ))}
              </select>
              <input
                type="number"
                className="border rounded px-3 py-2 bg-gray-100"
                value="1"
                placeholder={
                  selectedItemId
                    ? selectedStockId
                      ? "Quantidade fixa: 1"
                      : "Selecione o tamanho"
                    : "Selecione o uniforme/produto"
                }
                disabled
              />
              <button
                onClick={handleAddToCart}
                disabled={!selectedItemId || !selectedStockId}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-4 py-2 rounded flex items-center justify-center"
                title="Adicionar ao carrinho"
              >
                <LuPlus className="text-xl" />
              </button>
            </div>

            <div className="mb-3 border border-gray-200 rounded-lg bg-gray-50/70">
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Carrinho da Retirada</h4>
                <span className="text-xs text-gray-500">
                  Itens: <strong>{cart.length}</strong>
                </span>
              </div>
              {cart.length === 0 ? (
                <p className="text-sm text-gray-600 px-3 py-2.5">Carrinho vazio.</p>
              ) : (
                <div className="divide-y divide-gray-200">
                  {cart.map((c) => (
                    <div
                      key={c.uniformStockSizeId}
                      className="px-3 py-2 flex items-center justify-between gap-2"
                    >
                      <span className="text-sm text-gray-800">
                        {c.label} - Qtd: {c.quantity}
                      </span>
                      <button
                        onClick={() => removeFromCart(c.uniformStockSizeId)}
                        className="bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                  {willExceedLimit && (
                    <input
                      className="border rounded px-3 py-2 border-amber-500"
                      placeholder="Justificativa para exceder limite (obrigatória)"
                      value={justificativaExcedente}
                      onChange={(e) => setJustificativaExcedente(e.target.value)}
                    />
                  )}
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Observações da retirada (opcional)"
                    value={observacoesRetirada}
                    onChange={(e) => setObservacoesRetirada(e.target.value)}
                  />
                </div>
                {willExceedLimit && (
                  <p className="text-sm text-amber-700 mb-2">
                    Esta retirada excede o limite anual e exige justificativa.
                  </p>
                )}

                <button
                  onClick={handleCreateWithdrawal}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded"
                >
                  Confirmar Retirada
                </button>
              </>
            )}
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Retiradas em Aberto</h3>
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
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-gray-50 rounded p-2 text-sm">
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleReturnItems(w)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-2 rounded"
                      >
                        Registrar Devolução
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {popup.show && (
        <div
          className={`fixed bottom-5 right-5 px-4 py-2 rounded shadow text-white ${
            popup.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}

import { useEffect, useMemo, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";
import { LuPlus } from "react-icons/lu";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const STATUS_RETIRADA_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Extra",
  CHARGEABLE: "Com Cobrança",
  PARTIAL_RETURN: "Devolução Parcial",
  SETTLED_RETURN: "Devolução Total",
  SETTLED_DISCOUNT: "Baixa Financeira",
};

export default function RetiradaUniformes() {
  const [workType, setWorkType] = useState("");
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
  const [allowZeroOrNegativeStockMovement, setAllowZeroOrNegativeStockMovement] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [justificativaExcedente, setJustificativaExcedente] = useState("");
  const [observacoesRetirada, setObservacoesRetirada] = useState("");
  const [cart, setCart] = useState([]);
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

  const loadStockOptions = async () => {
    try {
      const res = await api.get("/uniforms/stock-options");
      if (res.data?.success) {
        setStockOptions(res.data.data || []);
        setAllowZeroOrNegativeStockMovement(
          Boolean(res.data.allowZeroOrNegativeStockMovement)
        );
      }
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

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11) {
      loadSummary(cpfDigits);
    }
  }, [workType]);

  const loadSummary = async (cpfValue) => {
    if (!cpfValue?.trim()) {
      showTemporaryPopup("Informe o CPF para buscar o colaborador.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/uniforms/employee/${cpfValue.trim()}/summary`, {
        params: { workType },
      });
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

  const willExceedLimit = useMemo(() => {
    if (!summary) return false;
    const alreadyWithdrawn = Number(summary.withdrawnInYear || 0);
    const annualLimit = Number(summary.limitApplied || 0);
    // [MANUTENCAO] Motivo: limite anual deve considerar número de retiradas, não quantidade de itens na mesma retirada.
    // [MANUTENCAO] Impacto: evita pedir justificativa ao adicionar segundo item em uma única retirada válida.
    // [MANUTENCAO] Data: 2026-06-05
    // [MANUTENCAO] Autor: Márlon Etiene
    return alreadyWithdrawn + 1 > annualLimit;
  }, [summary]);

  const handleAddToCart = () => {
    if (!workType) {
      showTemporaryPopup("Selecione a jornada do colaborador antes de adicionar itens.", "error");
      return;
    }

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

    if (!allowZeroOrNegativeStockMovement && Number(selected.qtyMainStock) < 1) {
      showTemporaryPopup("Sem saldo disponível para este tamanho.", "error");
      return;
    }

    const mesesValidade =
      workType === "PLANTONISTA"
        ? Number(selected.item?.validadePlantonistaMeses || 12)
        : Number(selected.item?.validadeDiaristaMeses || 12);
    const dataValidade = new Date();
    dataValidade.setMonth(dataValidade.getMonth() + mesesValidade);

    setCart((prev) => [
      ...prev,
      {
        itemId: Number(selected.itemId),
        uniformStockSizeId: Number(stockId),
        quantity: 1,
        label: `${selected.item?.itemName || "Item"} - Tam ${selected.size}`,
        validadePrevista: dataValidade.toLocaleDateString("pt-BR"),
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

    setProcessing(true);
    try {
      const res = await api.post("/uniforms/withdraw", {
        cpf: summary.employee.cpf,
        workType,
        items: cart,
        nonDeliveryJustification: justificativaExcedente?.trim() || null,
        notes: observacoesRetirada?.trim() || null,
      });

      if (res.data?.success) {
        const emailNotification = res.data?.emailNotification;
        if (emailNotification?.success === false) {
          showTemporaryPopup(
            `${res.data?.message || "Retirada registrada com sucesso."} ${emailNotification.message || ""}`.trim(),
            "error"
          );
        } else {
          showTemporaryPopup(
            `${res.data?.message || "Retirada registrada com sucesso."} ${emailNotification?.message || ""}`.trim(),
            "success"
          );
        }
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
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Retirada de Uniformes</h2>
        <p className="text-gray-600 text-sm">
          Busca por CPF e retirada com múltiplos itens.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mb-2">
              <div><strong>Nome:</strong> {summary.employee?.name}</div>
              <div><strong>CPF:</strong> {summary.employee?.cpf}</div>
            </div>
            <div className="mb-2">
              <p className="text-sm font-semibold text-gray-700 mb-1">Jornada do colaborador</p>
              <div className="relative flex flex-wrap rounded-lg bg-gray-200 p-1 w-full max-w-[320px] text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
                <label className="flex-1 text-center">
                  <input
                    type="radio"
                    name="workType"
                    value="PLANTONISTA"
                    checked={workType === "PLANTONISTA"}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="peer sr-only"
                  />
                  <span className="flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-slate-700 transition-all duration-150 ease-in-out peer-checked:bg-white peer-checked:font-semibold">
                    Plantonista
                  </span>
                </label>
                <label className="flex-1 text-center">
                  <input
                    type="radio"
                    name="workType"
                    value="DIARISTA"
                    checked={workType === "DIARISTA"}
                    onChange={(e) => setWorkType(e.target.value)}
                    className="peer sr-only"
                  />
                  <span className="flex cursor-pointer items-center justify-center rounded-lg px-3 py-2 text-slate-700 transition-all duration-150 ease-in-out peer-checked:bg-white peer-checked:font-semibold">
                    Diarista
                  </span>
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Limite anual:</strong>{" "}
                {workType
                  ? `${summary.limitApplied} (${workType === "PLANTONISTA" ? "Plantonista" : "Diarista"})`
                  : "Selecione a jornada"}
              </div>
              <div><strong>Retiradas no ano:</strong> {workType ? summary.withdrawnInYear : "-"}</div>
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
                disabled={!workType || !selectedItemId || !selectedStockId || processing}
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
                        {c.label} - Qtd: {c.quantity} - Validade prevista: {c.validadePrevista}
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
                  disabled={processing}
                  className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded"
                >
                  {processing ? "Aguarde..." : "Confirmar Retirada"}
                </button>
              </>
            )}
          </section>

          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Última Retirada</h3>
            {!summary.lastWithdrawal ? (
              <p className="text-sm text-gray-600">Este colaborador ainda não possui retirada registrada.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm mb-2">
                  <div><strong>Protocolo:</strong> #{summary.lastWithdrawal.id}</div>
                  <div><strong>Data:</strong> {new Date(summary.lastWithdrawal.withdrawDate).toLocaleString("pt-BR")}</div>
                  <div><strong>Status:</strong> {formatarStatusRetirada(summary.lastWithdrawal.status)}</div>
                  <div><strong>Qtd. total:</strong> {summary.lastWithdrawal.totalQuantity}</div>
                </div>
                <div className="border border-gray-200 rounded-lg bg-gray-50/70">
                  <div className="px-3 py-2 border-b border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700">Itens da Última Retirada</h4>
                  </div>
                  {summary.lastWithdrawal.items?.length ? (
                    <div className="divide-y divide-gray-200">
                      {summary.lastWithdrawal.items.map((item) => (
                        <div key={item.id} className="px-3 py-2 text-sm text-gray-800">
                          {item.uniformStockSize?.item?.itemName} - Tam {item.uniformStockSize?.size} - Qtd: {item.quantity} - Validade:{" "}
                          {item.dueDate
                            ? new Date(item.dueDate).toLocaleDateString("pt-BR")
                            : "Sem prazo de devolução"}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-sm text-gray-600">Sem itens detalhados para esta retirada.</p>
                  )}
                </div>
              </>
            )}
          </section>

        </>
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
            Aguarde... processando retirada e envio de e-mail.
          </div>
        </div>
      )}
    </div>
  );
}


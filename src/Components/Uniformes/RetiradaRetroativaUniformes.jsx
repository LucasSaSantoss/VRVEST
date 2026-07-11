import { useEffect, useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { api, obterMensagemErroApi } from "../../services/api";
import SearchableSelect from "../Common/SearchableSelect";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const STATUS_RETIRADA_LABEL = {
  REGULAR: "Retirada",
  EXEMPT: "Extra",
  CHARGEABLE: "Com Cobrança",
  PARTIAL_RETURN: "Devolução Parcial",
  SETTLED_RETURN: "Devolução Total",
  SETTLED_DISCOUNT: "Baixa Financeira",
};

const getYesterdayInputValue = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().slice(0, 10);
};

const isRetroactiveDate = (value) => {
  if (!value) return false;
  const selected = new Date(`${value}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selected < today;
};

const addMonthsToInputDate = (value, months) => {
  const date = new Date(`${value}T12:00:00`);
  date.setMonth(date.getMonth() + Number(months || 0));
  return date;
};

export default function RetiradaRetroativaUniformes() {
  const [workType, setWorkType] = useState("");
  const [withdrawDate, setWithdrawDate] = useState("");
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
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

  const getSelectedYear = () => {
    if (!withdrawDate) return new Date().getFullYear();
    const date = new Date(`${withdrawDate}T00:00:00`);
    return Number.isNaN(date.getTime()) ? new Date().getFullYear() : date.getFullYear();
  };

  const loadStockOptions = async () => {
    try {
      const res = await api.get("/uniform-stock/sizes");
      if (res.data?.success) {
        const activeUniforms = (res.data.data || []).filter(
          (entry) =>
            Number(entry.item?.isUniform || 0) === 1 &&
            Number(entry.item?.active || 0) === 1
        );
        setStockOptions(activeUniforms);
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar uniformes para registro anterior."),
        "error"
      );
    }
  };

  const loadSummary = async (cpfValue) => {
    if (!cpfValue?.trim()) {
      showTemporaryPopup("Informe o CPF para buscar o colaborador.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/uniforms/employee/${cpfValue.trim()}/summary`, {
        params: { workType, year: getSelectedYear() },
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
    if (cpfDigits.length === 11 && workType) {
      loadSummary(cpfDigits);
    }
  }, [workType, withdrawDate]);

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
    if (!summary || !workType || !withdrawDate) return false;
    const alreadyWithdrawn = Number(summary.withdrawnInYear || 0);
    const annualLimit = Number(summary.limitApplied || 0);
    return alreadyWithdrawn + 1 > annualLimit;
  }, [summary, workType, withdrawDate]);

  const canAddToCart = Boolean(
    workType &&
      withdrawDate &&
      isRetroactiveDate(withdrawDate) &&
      selectedItemId &&
      selectedStockId &&
      !processing
  );
  const addToCartDisabledReason = canAddToCart
    ? "Adicionar ao carrinho"
    : "Preencha os campos obrigatórios: jornada, data retroativa, uniforme e tamanho.";

  const handleAddToCart = () => {
    if (!workType) {
      showTemporaryPopup("Selecione a jornada do colaborador antes de adicionar itens.", "error");
      return;
    }
    if (!isRetroactiveDate(withdrawDate)) {
      showTemporaryPopup("Informe uma data de retirada anterior à data atual.", "error");
      return;
    }

    const stockId = String(selectedStockId);
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

    const mesesValidade =
      workType === "PLANTONISTA"
        ? Number(selected.item?.validadePlantonistaMeses || 12)
        : Number(selected.item?.validadeDiaristaMeses || 12);
    const dataValidade = addMonthsToInputDate(withdrawDate, mesesValidade);

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
    setSelectedItemId("");
    setSelectedStockId("");
  };

  const removeFromCart = (uniformStockSizeId) => {
    setCart((prev) => prev.filter((c) => c.uniformStockSizeId !== uniformStockSizeId));
  };

  const handleCreateWithdrawal = async () => {
    if (!summary?.employee?.cpf) {
      showTemporaryPopup("Busque o colaborador antes de registrar a retirada anterior.", "error");
      return;
    }
    if (!isRetroactiveDate(withdrawDate)) {
      showTemporaryPopup("A data da retirada anterior deve ser menor que a data atual.", "error");
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
      const res = await api.post("/uniforms/withdraw/retroactive", {
        cpf: summary.employee.cpf,
        workType,
        withdrawDate,
        items: cart,
        nonDeliveryJustification: justificativaExcedente?.trim() || null,
        notes: observacoesRetirada?.trim() || null,
      });

      if (res.data?.success) {
        showTemporaryPopup(
          res.data?.message || "Registro de retirada anterior criado com sucesso.",
          "success"
        );
        setCart([]);
        setSelectedItemId("");
        setSelectedStockId("");
        setJustificativaExcedente("");
        setObservacoesRetirada("");
        await loadSummary(summary.employee.cpf);
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar retirada anterior."),
        "error"
      );
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Registro de Retirada Anterior</h2>
        <p className="text-gray-600 text-sm">
          Registre retiradas antigas que não foram lançadas no sistema. Esta rotina não baixa o estoque atual.
        </p>
      </div>

      <section className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-4 mb-3 text-sm text-amber-900">
        <strong>Atenção:</strong> use esta rotina somente para registrar retirada anterior. Quando o uniforme for devolvido, a devolução entrará no estoque de empréstimos.
      </section>

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
          <input
            type="date"
            max={getYesterdayInputValue()}
            className="border rounded px-3 py-2"
            value={withdrawDate}
            onChange={(e) => setWithdrawDate(e.target.value)}
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
              <p className="text-sm font-semibold text-gray-700 mb-1">
                Jornada do colaborador <span className="text-red-600">*</span>
              </p>
              <div className="relative flex flex-wrap rounded-lg bg-gray-200 p-1 w-full max-w-[320px] text-sm shadow-[0_0_0_1px_rgba(0,0,0,0.06)]">
                <label className="flex-1 text-center">
                  <input
                    type="radio"
                    name="workTypeRetroactive"
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
                    name="workTypeRetroactive"
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
              <div>
                <strong>Ano considerado:</strong>{" "}
                {withdrawDate ? getSelectedYear() : "Informe a data"}
              </div>
              <div>
                <strong>Limite anual:</strong>{" "}
                {workType ? summary.limitApplied : "Selecione a jornada"}
              </div>
              <div><strong>Retiradas no ano:</strong> {workType ? summary.withdrawnInYear : "-"}</div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Retirada Anterior</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Uniforme <span className="text-red-600">*</span>
                </label>
                <SearchableSelect
                  value={selectedItemId}
                  onChange={(value) => {
                    setSelectedItemId(value);
                    setSelectedStockId("");
                  }}
                  options={productOptions.map((product) => ({
                    value: product.itemId,
                    label: product.itemName,
                  }))}
                  placeholder="Selecione o uniforme/produto"
                  searchPlaceholder="Buscar uniforme..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tamanho <span className="text-red-600">*</span>
                </label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={selectedStockId}
                  onChange={(e) => setSelectedStockId(e.target.value)}
                  disabled={!selectedItemId}
                >
                  <option value="">{selectedItemId ? "Selecione o tamanho" : "..."}</option>
                  {sizeOptionsByProduct.map((s) => (
                    <option key={s.id} value={s.id}>
                      Tam {s.size}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade
                </label>
                <input
                  type="number"
                  className="border rounded px-3 py-2 bg-gray-100 w-full"
                  value="1"
                  disabled
                />
              </div>
              <div className="flex items-end">
                <span className="w-full" title={addToCartDisabledReason}>
                  <button
                    onClick={handleAddToCart}
                    disabled={!canAddToCart}
                    className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-4 py-2 rounded flex items-center justify-center w-full"
                    title={addToCartDisabledReason}
                  >
                    <LuPlus className="text-xl" />
                  </button>
                </span>
              </div>
            </div>

            <div className="mb-3 border border-gray-200 rounded-lg bg-gray-50/70">
              <div className="px-3 py-2 border-b border-gray-200 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">Carrinho da Retirada Anterior</h4>
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
                    placeholder="Observações do registro anterior (opcional)"
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
                  {processing ? "Aguarde..." : "Confirmar Registro Anterior"}
                </button>
              </>
            )}
          </section>

          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Última Retirada</h3>
            {!summary.lastWithdrawal ? (
              <p className="text-sm text-gray-600">Este colaborador ainda não possui retirada registrada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                <div><strong>Protocolo:</strong> #{summary.lastWithdrawal.id}</div>
                <div><strong>Data:</strong> {new Date(summary.lastWithdrawal.withdrawDate).toLocaleString("pt-BR")}</div>
                <div><strong>Status:</strong> {formatarStatusRetirada(summary.lastWithdrawal.status)}</div>
                <div><strong>Qtd. total:</strong> {summary.lastWithdrawal.totalQuantity}</div>
              </div>
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
            Aguarde... registrando retirada anterior.
          </div>
        </div>
      )}
    </div>
  );
}

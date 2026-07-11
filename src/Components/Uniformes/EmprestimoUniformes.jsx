import { useEffect, useMemo, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";
import { LuPlus } from "react-icons/lu";
import SearchableSelect from "../Common/SearchableSelect";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

export default function EmprestimoUniformes() {
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedStockId, setSelectedStockId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [notes, setNotes] = useState("");
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [lastAutoCpfSearched, setLastAutoCpfSearched] = useState("");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const loadStockOptions = async () => {
    try {
      const res = await api.get("/uniforms/loan/stock-options");
      if (res.data?.success) {
        setStockOptions(res.data.data || []);
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar opções de uniforme."),
        "error"
      );
    }
  };

  const loadSummary = async (cpfValue) => {
    if (!cpfValue?.trim()) return;
    setLoading(true);
    try {
      const res = await api.get(`/uniforms/loan/employee/${cpfValue.trim()}/summary`);
      if (res.data?.success) {
        setSummary(res.data.data);
      }
    } catch (error) {
      setSummary(null);
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar dados do colaborador."),
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

  const productOptions = useMemo(() => {
    const map = new Map();
    stockOptions.forEach((entry) => {
      const key = String(entry.itemId);
      if (!map.has(key)) {
        map.set(key, {
          itemId: entry.itemId,
          itemName: entry.item?.itemName || "Item",
        });
      }
    });
    return Array.from(map.values());
  }, [stockOptions]);

  const sizeOptionsByProduct = useMemo(
    () => stockOptions.filter((entry) => String(entry.itemId) === String(selectedItemId)),
    [stockOptions, selectedItemId]
  );

  const handleAddToCart = () => {
    const stock = stockOptions.find((entry) => String(entry.id) === String(selectedStockId));
    const qty = Number(quantity || 0);

    if (!stock || qty <= 0) {
      showTemporaryPopup("Selecione uniforme/tamanho e informe quantidade válida.", "error");
      return;
    }

    if (Number(stock.qtyLoanStock) <= 0) {
      showTemporaryPopup("Não é permitido emprestar item com estoque de empréstimo zerado.", "error");
      return;
    }

    if (qty > Number(stock.qtyLoanStock || 0)) {
      showTemporaryPopup("Quantidade acima do saldo disponível no estoque de empréstimos.", "error");
      return;
    }

    setCart((prev) => [
      ...prev,
      {
        uniformStockSizeId: Number(stock.id),
        itemId: Number(stock.itemId),
        quantity: qty,
        label: `${stock.item?.itemName} - Tam ${stock.size}`,
      },
    ]);
    // [MANUTENCAO] Motivo: exigir nova seleção após cada inclusão no carrinho de empréstimos.
    // [MANUTENCAO] Impacto: reduz inclusões repetidas acidentais sem impedir o empréstimo do mesmo item novamente.
    // [MANUTENCAO] Data: 2026-06-22
    // [MANUTENCAO] Autor: Márlon Etiene
    setSelectedItemId("");
    setSelectedStockId("");
    setQuantity("1");
  };

  const handleRemoveFromCart = (indexToRemove) => {
    // [MANUTENCAO] Motivo: permitir correção do carrinho antes de confirmar empréstimo de uniformes.
    // [MANUTENCAO] Impacto: remove apenas o item selecionado localmente, sem movimentar estoque ou alterar backend.
    // [MANUTENCAO] Data: 2026-06-16
    // [MANUTENCAO] Autor: Márlon Etiene
    setCart((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCreateLoan = async () => {
    if (!summary?.employee?.cpf) {
      showTemporaryPopup("Busque o colaborador antes de registrar empréstimo.", "error");
      return;
    }

    if (cart.length === 0) {
      showTemporaryPopup("Adicione ao menos um item no carrinho.", "error");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post("/uniforms/loan/withdraw", {
        cpf: summary.employee.cpf,
        items: cart,
        notes: notes?.trim() || null,
      });
      if (res.data?.success) {
        const emailNotification = res.data?.emailNotification;
        if (emailNotification?.success === false) {
          showTemporaryPopup(
            `${res.data.message || "Empréstimo registrado com sucesso."} ${emailNotification.message || ""}`.trim(),
            "error"
          );
        } else {
          showTemporaryPopup(
            `${res.data.message || "Empréstimo registrado com sucesso."} ${emailNotification?.message || ""}`.trim(),
            "success"
          );
        }
        setCart([]);
        setSelectedItemId("");
        setSelectedStockId("");
        setNotes("");
        await loadStockOptions();
        await loadSummary(summary.employee.cpf);
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao registrar empréstimo."), "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Empréstimo de Uniformes</h2>
        <p className="text-gray-600 text-sm">Saída no estoque de empréstimos por CPF.</p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Consulta de Colaborador</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            className="border rounded px-3 py-2"
            placeholder="CPF (somente números)"
            value={cpf}
            onChange={(e) => {
              const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 11);
              setCpf(digits);
              if (digits.length < 11) setLastAutoCpfSearched("");
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
            <h3 className="font-semibold text-gray-700 mb-2">Nova Saída de Empréstimo</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
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

              <select
                className="border rounded px-3 py-2"
                value={selectedStockId}
                onChange={(e) => setSelectedStockId(e.target.value)}
                disabled={!selectedItemId}
              >
                <option value="">{selectedItemId ? "Selecione o tamanho" : "..."}</option>
                {sizeOptionsByProduct.map((s) => (
                  <option key={s.id} value={s.id}>
                    Tam {s.size} (Saldo empréstimo: {s.qtyLoanStock})
                  </option>
                ))}
              </select>

              <input
                type="number"
                min="1"
                className="border rounded px-3 py-2"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button
                onClick={handleAddToCart}
                disabled={!selectedItemId || !selectedStockId || processing}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-4 py-2 rounded flex items-center justify-center"
              >
                <LuPlus className="text-xl" />
              </button>
            </div>

            <div className="mb-2 text-sm">
              {cart.length === 0
                ? "Carrinho vazio."
                : cart.map((c, idx) => (
                    <div
                      key={`${c.uniformStockSizeId}-${idx}`}
                      className="flex items-center justify-between gap-3 border-b py-2 last:border-b-0"
                    >
                      <span>
                        {c.label} - Qtd: {c.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(idx)}
                        disabled={processing}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-xs font-semibold px-3 py-1 rounded"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
            </div>

            <input
              className="border rounded px-3 py-2 w-full mb-2"
              placeholder="Observações (opcional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            <button
              onClick={handleCreateLoan}
              disabled={processing || cart.length === 0}
              className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded"
            >
              {processing ? "Aguarde..." : "Confirmar Empréstimo"}
            </button>
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Instrução Operacional</h3>
            <p className="text-sm text-gray-700">
              <strong>Colaborador:</strong> {summary.employee?.name} ({summary.employee?.cpf})
            </p>
            <p className="text-sm text-gray-600 mt-1">
              Para registrar devoluções de empréstimos, utilize o módulo
              <strong> Devolução de Empréstimos</strong> no menu de Uniformes.
            </p>
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
    </div>
  );
}

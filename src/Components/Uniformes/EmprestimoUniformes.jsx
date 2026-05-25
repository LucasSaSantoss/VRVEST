import { useEffect, useMemo, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";
import { LuPlus } from "react-icons/lu";

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
  const [returnQtyMap, setReturnQtyMap] = useState({});
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
        setReturnQtyMap({});
      }
    } catch (error) {
      setSummary(null);
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao carregar empréstimos."), "error");
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
      if (!map.has(key)) map.set(key, { itemId: entry.itemId, itemName: entry.item?.itemName || "Item" });
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
    setCart((prev) => [...prev, {
      uniformStockSizeId: Number(stock.id),
      itemId: Number(stock.itemId),
      quantity: qty,
      label: `${stock.item?.itemName} - Tam ${stock.size}`,
    }]);
    setQuantity("1");
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
        showTemporaryPopup(res.data.message || "Empréstimo registrado com sucesso.", "success");
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

  const handleReturnLoan = async (loan) => {
    const items = loan.items
      .map((item) => ({ uniformLoanItemId: item.id, quantity: Number(returnQtyMap[item.id] || 0) }))
      .filter((entry) => entry.quantity > 0);
    if (items.length === 0) {
      showTemporaryPopup("Informe ao menos uma quantidade para devolução.", "error");
      return;
    }
    setProcessing(true);
    try {
      const res = await api.post(`/uniforms/loan/${loan.id}/return`, { items });
      if (res.data?.success) {
        showTemporaryPopup(res.data.message || "Devolução registrada.", "success");
        await loadStockOptions();
        await loadSummary(summary.employee.cpf);
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao devolver empréstimo."), "error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Empréstimo de Uniformes</h2>
        <p className="text-gray-600 text-sm">Retirada e devolução no estoque de empréstimos por CPF.</p>
      </div>
      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Consulta de Colaborador</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input className="border rounded px-3 py-2" placeholder="CPF (somente números)" value={cpf} onChange={(e) => {
            const digits = String(e.target.value || "").replace(/\D/g, "").slice(0, 11);
            setCpf(digits);
            if (digits.length < 11) setLastAutoCpfSearched("");
          }} />
          <button onClick={() => loadSummary(cpf)} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">{loading ? "Buscando..." : "Buscar CPF"}</button>
        </div>
      </section>

      {summary && (
        <>
          <section className="bg-white rounded-xl shadow p-4 mb-3">
            <h3 className="font-semibold text-gray-700 mb-2">Nova Saída de Empréstimo</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
              <select className="border rounded px-3 py-2" value={selectedItemId} onChange={(e) => { setSelectedItemId(e.target.value); setSelectedStockId(""); }}>
                <option value="">Selecione o uniforme/produto</option>
                {productOptions.map((p) => <option key={p.itemId} value={p.itemId}>{p.itemName}</option>)}
              </select>
              <select className="border rounded px-3 py-2" value={selectedStockId} onChange={(e) => setSelectedStockId(e.target.value)} disabled={!selectedItemId}>
                <option value="">{selectedItemId ? "Selecione o tamanho" : "..."}</option>
                {sizeOptionsByProduct.map((s) => <option key={s.id} value={s.id}>Tam {s.size} (Saldo empréstimo: {s.qtyLoanStock})</option>)}
              </select>
              <input type="number" min="1" className="border rounded px-3 py-2" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              <button onClick={handleAddToCart} disabled={!selectedItemId || !selectedStockId || processing} className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-4 py-2 rounded flex items-center justify-center"><LuPlus className="text-xl" /></button>
            </div>
            <div className="mb-2 text-sm">
              {cart.length === 0 ? "Carrinho vazio." : cart.map((c, idx) => <div key={`${c.uniformStockSizeId}-${idx}`}>{c.label} - Qtd: {c.quantity}</div>)}
            </div>
            <input className="border rounded px-3 py-2 w-full mb-2" placeholder="Observações (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
            <button onClick={handleCreateLoan} disabled={processing || cart.length === 0} className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded">{processing ? "Aguarde..." : "Confirmar Empréstimo"}</button>
          </section>

          <section className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Empréstimos em Aberto</h3>
            {(summary.openLoans || []).length === 0 ? (
              <p className="text-sm text-gray-600">Nenhum empréstimo pendente para este colaborador.</p>
            ) : (
              <div className="space-y-4">
                {summary.openLoans.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-3">
                    <div className="text-sm mb-2"><strong>Empréstimo:</strong> #{loan.id} | <strong>Data:</strong> {new Date(loan.loanDate).toLocaleString("pt-BR")}</div>
                    <div className="space-y-2 mb-2">
                      {loan.items.map((item) => (
                        <div key={item.id} className="grid grid-cols-1 md:grid-cols-5 gap-2 items-center bg-gray-50 rounded p-2 text-sm">
                          <span className="md:col-span-2">{item.uniformStockSize?.item?.itemName} - Tam {item.uniformStockSize?.size}</span>
                          <span>Pendente: {item.pendingQuantity}</span>
                          <input type="number" min="0" max={item.pendingQuantity} className="border rounded px-2 py-1" placeholder="Qtd devolver" value={returnQtyMap[item.id] || ""} onChange={(e) => setReturnQtyMap((prev) => ({ ...prev, [item.id]: e.target.value }))} />
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleReturnLoan(loan)} disabled={processing} className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-3 py-2 rounded">{processing ? "Aguarde..." : "Registrar Devolução"}</button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {popup.show && <div className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${popup.type === "success" ? "bg-green-600" : "bg-red-600"}`}>{popup.message}</div>}
    </div>
  );
}

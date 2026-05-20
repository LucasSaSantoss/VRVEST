import { useCallback, useEffect, useMemo, useState } from "react";
import { listarItems } from "../../services/api";
import { api } from "../../services/api";
import { obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const INITIAL_MODAL = { open: false, type: "" };
const DEFAULT_SIZE_CODES = ["P", "M", "G", "GG", "XXG", "EXG", "G1"];
const TIPO_MOVIMENTACAO_LABEL = {
  ENTRY: "Entrada",
  DISCARD: "Descarte",
  ADJUSTMENT: "Ajuste",
  REVERSAL: "Desfazer",
};

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 font-bold"
          >
            X
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function EntradaEstoqueUniformes() {
  const [items, setItems] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [sizeCatalog, setSizeCatalog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [modal, setModal] = useState(INITIAL_MODAL);
  const [movements, setMovements] = useState([]);
  const [reversingMovementId, setReversingMovementId] = useState(null);
  const [reverseTarget, setReverseTarget] = useState(null);
  const [reverseReason, setReverseReason] = useState("");
  const [annualLimit, setAnnualLimit] = useState(2);
  const [annualLimitInput, setAnnualLimitInput] = useState("2");
  const [savingAnnualLimit, setSavingAnnualLimit] = useState(false);

  const [selectedStockId, setSelectedStockId] = useState("");
  const [entryQty, setEntryQty] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");

  const [sizeItemId, setSizeItemId] = useState("");
  const [sizeValue, setSizeValue] = useState("");
  const [sizeMinStock, setSizeMinStock] = useState("");
  const [sizeInitialMain, setSizeInitialMain] = useState("");
  const [sizeInitialLoan, setSizeInitialLoan] = useState("");

  const [mainAdjustDelta, setMainAdjustDelta] = useState("");
  const [mainAdjustReason, setMainAdjustReason] = useState("");

  const [loanAdjustDelta, setLoanAdjustDelta] = useState("");
  const [loanAdjustReason, setLoanAdjustReason] = useState("");

  const [transferQty, setTransferQty] = useState("");
  const [transferReason, setTransferReason] = useState("");

  const [discardSource, setDiscardSource] = useState("MAIN");
  const [discardQty, setDiscardQty] = useState("");
  const [discardReason, setDiscardReason] = useState("");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const closeModal = () => setModal(INITIAL_MODAL);
  const openModal = (type) => setModal({ open: true, type });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [itemsRes, stockRes, catalogRes, settingsRes] = await Promise.all([
        listarItems(),
        api.get("/uniform-stock/sizes"),
        api.get("/uniform-stock/sizes-catalog"),
        api.get("/uniforms/settings"),
      ]);
      if (itemsRes?.success) setItems(itemsRes.data || []);
      if (stockRes?.data?.success) {
        const list = stockRes.data.data || [];
        setSizes(list);
      }
      if (catalogRes?.data?.success) {
        const apiCatalog = catalogRes.data.data || [];
        setSizeCatalog(
          apiCatalog.length > 0
            ? apiCatalog
            : DEFAULT_SIZE_CODES.map((code, index) => ({ id: `fallback-${index}`, code }))
        );
      }
      if (settingsRes?.data?.success) {
        const limit = Number(settingsRes.data.data?.annualLimit || 2);
        setAnnualLimit(limit);
        setAnnualLimitInput(String(limit));
      }
    } catch (error) {
      console.error("Erro ao carregar estoque de uniformes:", error);
      showTemporaryPopup("Erro ao carregar dados do estoque.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSaveAnnualLimit = async () => {
    try {
      const parsed = Number(annualLimitInput);
      if (!Number.isInteger(parsed) || parsed <= 0) {
        showTemporaryPopup("Informe um limite anual inteiro maior que zero.", "error");
        return;
      }

      setSavingAnnualLimit(true);
      const res = await api.put("/uniforms/settings/annual-limit", {
        annualLimit: parsed,
      });
      if (res.data?.success) {
        setAnnualLimit(parsed);
        closeModal();
        showTemporaryPopup("Limite anual atualizado com sucesso.", "success");
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const statusCode = error?.response?.status;
      showTemporaryPopup(
        backendMessage
          ? `Erro ao atualizar limite anual: ${backendMessage}`
          : `Erro ao atualizar limite anual${statusCode ? ` (HTTP ${statusCode})` : ""}.`,
        "error"
      );
    } finally {
      setSavingAnnualLimit(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedStock = useMemo(
    () => sizes.find((s) => String(s.id) === String(selectedStockId)),
    [sizes, selectedStockId]
  );
  const uniformItems = useMemo(
    () => (items || []).filter((item) => Number(item?.isUniform) === 1),
    [items]
  );

  const handleCreateSize = async () => {
    try {
      if (!sizeItemId || !sizeValue.trim()) {
        showTemporaryPopup("Produto e tamanho são obrigatórios.", "error");
        return;
      }
      const payload = {
        itemId: Number(sizeItemId),
        size: sizeValue.trim().toUpperCase(),
        minStock: Number(sizeMinStock || 0),
        qtyMainStock: Number(sizeInitialMain || 0),
        qtyLoanStock: Number(sizeInitialLoan || 0),
      };
      const res = await api.post("/uniform-stock/sizes", payload);
      if (res.data?.success) {
        showTemporaryPopup("Tamanho cadastrado com sucesso.", "success");
        setSizeItemId("");
        setSizeValue("");
        setSizeMinStock("");
        setSizeInitialMain("");
        setSizeInitialLoan("");
        closeModal();
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao cadastrar tamanho."),
        "error"
      );
    }
  };

  const handleMainEntry = async () => {
    try {
      if (!selectedStockId || Number(entryQty) <= 0 || !invoiceNumber.trim()) {
        showTemporaryPopup(
          "Selecione o produto, informe quantidade e número da NF.",
          "error"
        );
        return;
      }
      const res = await api.post("/uniform-stock/entry", {
        uniformStockSizeId: Number(selectedStockId),
        quantity: Number(entryQty),
        notes: `NF: ${invoiceNumber.trim()}`,
      });
      if (res.data?.success) {
        showTemporaryPopup("Entrada no estoque principal registrada.", "success");
        setEntryQty("");
        setInvoiceNumber("");
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar entrada."),
        "error"
      );
    }
  };

  const handleMainAdjust = async () => {
    try {
      if (!selectedStockId || !Number(mainAdjustDelta) || !mainAdjustReason.trim()) {
        showTemporaryPopup(
          "Informe variação do estoque principal e justificativa.",
          "error"
        );
        return;
      }
      const res = await api.post("/uniform-stock/adjustment", {
        uniformStockSizeId: Number(selectedStockId),
        quantityDeltaMain: Number(mainAdjustDelta),
        quantityDeltaLoan: 0,
        notes: `Ajuste principal: ${mainAdjustReason.trim()}`,
      });
      if (res.data?.success) {
        showTemporaryPopup("Ajuste do estoque principal registrado.", "success");
        setMainAdjustDelta("");
        setMainAdjustReason("");
        closeModal();
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao ajustar estoque principal."),
        "error"
      );
    }
  };

  const handleLoanAdjust = async () => {
    try {
      if (!selectedStockId || !Number(loanAdjustDelta) || !loanAdjustReason.trim()) {
        showTemporaryPopup(
          "Informe variação de empréstimos e justificativa.",
          "error"
        );
        return;
      }
      const res = await api.post("/uniform-stock/adjustment", {
        uniformStockSizeId: Number(selectedStockId),
        quantityDeltaMain: 0,
        quantityDeltaLoan: Number(loanAdjustDelta),
        notes: `Ajuste empréstimos: ${loanAdjustReason.trim()}`,
      });
      if (res.data?.success) {
        showTemporaryPopup("Ajuste de empréstimos registrado.", "success");
        setLoanAdjustDelta("");
        setLoanAdjustReason("");
        closeModal();
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao ajustar empréstimos."),
        "error"
      );
    }
  };

  const handleTransferMainToLoan = async () => {
    try {
      if (!selectedStockId || Number(transferQty) <= 0 || !transferReason.trim()) {
        showTemporaryPopup(
          "Informe quantidade de transferência e justificativa.",
          "error"
        );
        return;
      }
      const res = await api.post("/uniform-stock/transfer-main-to-loan", {
        uniformStockSizeId: Number(selectedStockId),
        quantity: Number(transferQty),
        notes: transferReason.trim(),
      });
      if (res.data?.success) {
        showTemporaryPopup("Transferência para empréstimos registrada.", "success");
        setTransferQty("");
        setTransferReason("");
        closeModal();
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao transferir estoque."),
        "error"
      );
    }
  };

  const handleDiscard = async () => {
    try {
      if (!selectedStockId || Number(discardQty) <= 0 || !discardReason.trim()) {
        showTemporaryPopup(
          "Informe origem, quantidade positiva (maior que zero) e justificativa do descarte.",
          "error"
        );
        return;
      }
      const res = await api.post("/uniform-stock/discard", {
        uniformStockSizeId: Number(selectedStockId),
        quantity: Number(discardQty),
        source: discardSource,
        notes: discardReason.trim(),
      });
      if (res.data?.success) {
        showTemporaryPopup("Descarte registrado com sucesso.", "success");
        setDiscardQty("");
        setDiscardReason("");
        closeModal();
        await loadData();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar descarte."),
        "error"
      );
    }
  };

  const openHistoryModal = async () => {
    try {
      if (!selectedStockId) {
        showTemporaryPopup("Selecione um produto/uniforme.", "error");
        return;
      }
      const res = await api.get("/uniform-stock/movements", {
        params: { uniformStockSizeId: Number(selectedStockId), limit: 100 },
      });
      if (res.data?.success) {
        setMovements(res.data.data || []);
        openModal("history");
      }
    } catch (error) {
      const backendMessage = error?.response?.data?.message;
      const statusCode = error?.response?.status;
      showTemporaryPopup(
        backendMessage
          ? `Erro ao carregar histórico: ${backendMessage}`
          : `Erro ao carregar histórico de movimentações${statusCode ? ` (HTTP ${statusCode})` : ""}.`,
        "error"
      );
    }
  };

  const canReverseByDate = (dateValue) => {
    const movementDate = new Date(dateValue);
    if (Number.isNaN(movementDate.getTime())) return false;

    const startOfYesterday = new Date();
    startOfYesterday.setHours(0, 0, 0, 0);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    return movementDate >= startOfYesterday && movementDate <= endOfToday;
  };

  const openReverseModal = (movement) => {
    setReverseTarget(movement);
    setReverseReason("");
    openModal("reverse");
  };

  const handleReverseMovement = async () => {
    try {
      if (!reverseTarget?.id) return;
      if (!reverseReason || !reverseReason.trim()) {
        showTemporaryPopup("Justificativa obrigatória para desfazer.", "error");
        return;
      }

      setReversingMovementId(reverseTarget.id);
      const res = await api.post(`/uniform-stock/movements/${reverseTarget.id}/reverse`, {
        reason: reverseReason.trim(),
      });

      if (res.data?.success) {
        showTemporaryPopup("Movimentação desfeita com sucesso.", "success");
        closeModal();
        setReverseTarget(null);
        setReverseReason("");
        await loadData();
        await openHistoryModal();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao desfazer movimentação."),
        "error"
      );
    } finally {
      setReversingMovementId(null);
    }
  };

  const formatarTipoMovimentacao = (movementType) =>
    TIPO_MOVIMENTACAO_LABEL[movementType] || movementType || "-";

  return (
    <div className="w-full max-w-6xl mx-auto mt-2 pb-4">
      <div className="mb-3 border-l-4 border-blue-500 pl-3">
        <h2 className="text-lg font-bold text-gray-800">Estoque de Uniformes</h2>
        <p className="text-gray-600 text-xs sm:text-sm">
          Entrada no estoque principal, ajustes por estoque, transferência e descarte.
        </p>
      </div>

      <section className="bg-white rounded-xl shadow p-3 mb-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-700">Configuração de Limite Anual</h3>
            <p className="text-sm text-gray-600">
              Limite atual por funcionário/ano: <strong>{annualLimit}</strong>
            </p>
          </div>
          <button
            onClick={() => openModal("annualLimit")}
            className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-sm"
          >
            Alterar Limite Anual
          </button>
        </div>
      </section>

      <section className="bg-white rounded-xl shadow p-3 mb-2">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <h3 className="font-semibold text-gray-700">Produto/Uniforme</h3>
          <button
            onClick={() => openModal("size")}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-3 py-1.5 rounded text-sm"
          >
            Cadastrar Novo Tamanho
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-1">
          Selecione o produto/uniforme (com tamanho)
        </label>
        <select
          className="border rounded px-3 py-1.5 w-full text-sm"
          value={selectedStockId}
          onChange={(e) => setSelectedStockId(e.target.value)}
        >
          <option value="">Selecione</option>
          {sizes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.item?.itemName} - Tam {s.size}
            </option>
          ))}
        </select>
      </section>

      {!selectedStock && (
        <section className="bg-yellow-50 border border-yellow-200 rounded-xl p-2.5 mb-2">
          <p className="text-sm text-yellow-800">
            Selecione um produto/uniforme para visualizar o estoque atual e liberar as operações.
          </p>
        </section>
      )}

      {selectedStock && (
        <>
          <section className="bg-white rounded-xl shadow p-2.5 mb-2">
            <h3 className="font-semibold text-gray-700 mb-2">Estoque Atual</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">Principal</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{selectedStock.qtyMainStock}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">Empréstimos</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{selectedStock.qtyLoanStock}</p>
              </div>
              <div className="bg-gray-50 rounded p-2">
                <p className="text-xs text-gray-500">Mínimo</p>
                <p className="text-lg font-bold text-gray-800 leading-tight">{selectedStock.minStock}</p>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow p-3 mb-2">
            <h3 className="font-semibold text-gray-700 mb-2">Entrada no Estoque Principal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número da NF</label>
                <input
                  className="border rounded px-3 py-1.5 w-full text-sm"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex.: NF-12345"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de entrada
                </label>
                <input
                  type="number"
                  className="border rounded px-3 py-1.5 w-full text-sm"
                  value={entryQty}
                  onChange={(e) => setEntryQty(e.target.value)}
                  placeholder="Ex.: 10"
                />
              </div>
            </div>
            <button
              onClick={handleMainEntry}
              className="mt-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-4 py-1.5 rounded text-sm"
            >
              Confirmar Entrada Principal
            </button>
          </section>

          <section className="bg-white rounded-xl shadow p-3 mb-2">
            <h3 className="font-semibold text-gray-700 mb-2">Ações Complementares</h3>
            {/* [MANUTENCAO] Motivo: separar operações por estoque, incluir transferência explícita e histórico de movimentações.
                [MANUTENCAO] Impacto: reduz confusão operacional e aumenta rastreabilidade por usuário no módulo de estoque.
                [MANUTENCAO] Data: 2026-05-19
                [MANUTENCAO] Autor: Márlon Etiene */}
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => openModal("loanAdjust")}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-3 py-1.5 rounded text-sm"
              >
                Ajustar Estoque de Empréstimos
              </button>
              <button
                onClick={() => openModal("mainAdjust")}
                className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-3 py-1.5 rounded text-sm"
              >
                Ajustar Estoque Principal
              </button>
              <button
                onClick={() => openModal("transfer")}
                className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-3 py-1.5 rounded text-sm"
              >
                Transferir p/ Empréstimos
              </button>
              <button
                onClick={() => openModal("discard")}
                className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1.5 rounded text-sm"
              >
                Descartar Peças
              </button>
              <button
                onClick={openHistoryModal}
                className="bg-slate-700 hover:bg-slate-800 text-white font-semibold px-3 py-1.5 rounded text-sm"
              >
                Histórico de Movimentações
              </button>
            </div>
          </section>
        </>
      )}

      <Modal open={modal.open && modal.type === "size"} title="Cadastrar Novo Tamanho" onClose={closeModal}>
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
            <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">Produto/Uniforme</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={sizeItemId}
              onChange={(e) => setSizeItemId(e.target.value)}
            >
              <option value="">Selecione</option>
              {uniformItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.itemName}
                </option>
              ))}
            </select>
            </div>
            <div className="md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tamanho</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={sizeValue}
              onChange={(e) => setSizeValue(e.target.value)}
            >
              <option value="">Selecione</option>
              {sizeCatalog.map((s) => (
                <option key={s.id} value={s.code}>
                  {s.code}
                </option>
              ))}
            </select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={sizeMinStock}
                onChange={(e) => setSizeMinStock(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicial Principal</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={sizeInitialMain}
                onChange={(e) => setSizeInitialMain(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Inicial Empréstimos</label>
              <input
                type="number"
                className="border rounded px-3 py-2 w-full"
                value={sizeInitialLoan}
                onChange={(e) => setSizeInitialLoan(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={handleCreateSize}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Confirmar Cadastro
          </button>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "mainAdjust"}
        title="Ajustar Estoque Principal"
        onClose={closeModal}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variação (+/-)</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={mainAdjustDelta}
              onChange={(e) => setMainAdjustDelta(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (obrigatória)
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={mainAdjustReason}
              onChange={(e) => setMainAdjustReason(e.target.value)}
            />
          </div>
          <button
            onClick={handleMainAdjust}
            className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-4 py-2 rounded"
          >
            Confirmar Ajuste
          </button>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "loanAdjust"}
        title="Ajustar Estoque de Empréstimos"
        onClose={closeModal}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Variação (+/-)</label>
            <input
              type="number"
              className="border rounded px-3 py-2 w-full"
              value={loanAdjustDelta}
              onChange={(e) => setLoanAdjustDelta(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (obrigatória)
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={loanAdjustReason}
              onChange={(e) => setLoanAdjustReason(e.target.value)}
            />
          </div>
          <button
            onClick={handleLoanAdjust}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded"
          >
            Confirmar Ajuste
          </button>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "transfer"}
        title="Transferir Principal para Empréstimos"
        onClose={closeModal}
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantidade para transferência
            </label>
            <input
              type="number"
              min="1"
              className="border rounded px-3 py-2 w-full"
              value={transferQty}
              onChange={(e) => setTransferQty(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (obrigatória)
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={transferReason}
              onChange={(e) => setTransferReason(e.target.value)}
            />
          </div>
          <button
            onClick={handleTransferMainToLoan}
            className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-4 py-2 rounded"
          >
            Confirmar Transferência
          </button>
        </div>
      </Modal>

      <Modal open={modal.open && modal.type === "discard"} title="Descarte de Peças" onClose={closeModal}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Origem do Descarte</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={discardSource}
              onChange={(e) => setDiscardSource(e.target.value)}
            >
              <option value="MAIN">Estoque Principal</option>
              <option value="LOAN">Estoque Empréstimos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
            <input
              type="number"
              min="1"
              className="border rounded px-3 py-2 w-full"
              value={discardQty}
              onChange={(e) => setDiscardQty(e.target.value)}
            />
            <p className="text-xs text-gray-500 mt-1">
              Informe um valor positivo. Exemplo: 1, 2, 3...
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (obrigatória)
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={discardReason}
              onChange={(e) => setDiscardReason(e.target.value)}
            />
          </div>
          <button
            onClick={handleDiscard}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded"
          >
            Confirmar Descarte
          </button>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "history"}
        title="Histórico de Movimentações"
        onClose={closeModal}
      >
        <div className="max-h-[65vh] overflow-auto">
          {movements.length === 0 ? (
            <p className="text-sm text-gray-600">Nenhuma movimentação encontrada.</p>
          ) : (
            <table className="w-full text-sm table-fixed">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-3 pr-3 w-[18%]">Data</th>
                  <th className="py-3 pr-3 w-[12%]">Tipo</th>
                  <th className="py-3 pr-3 w-[8%]">Qtd.</th>
                  <th className="py-3 pr-3 w-[18%]">Usuário</th>
                  <th className="py-3 pr-3 w-[28%]">Observação</th>
                  <th className="py-3 w-[16%]">Ação</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => {
                  const alreadyReversed = movements.some(
                    (candidate) =>
                      candidate.referenceType === "UNIFORM_MOVEMENT_REVERSAL" &&
                      Number(candidate.referenceId) === Number(m.id)
                  );
                  const canReverse =
                    m.movementType !== "REVERSAL" &&
                    !alreadyReversed &&
                    canReverseByDate(m.createdAt);

                  return (
                    <tr key={m.id} className="border-b align-top">
                      <td className="py-3 pr-3 text-gray-800">
                        {new Date(m.createdAt).toLocaleString("pt-BR")}
                      </td>
                      <td className="py-3 pr-3">
                        <span className="inline-block bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                          {formatarTipoMovimentacao(m.movementType)}
                        </span>
                      </td>
                      <td className="py-3 pr-3 font-semibold text-gray-800">{m.quantity}</td>
                      <td className="py-3 pr-3 break-words text-gray-800">
                        <div className="font-medium">{m.user?.name || `ID ${m.userId}`}</div>
                        {m.user?.email && (
                          <div className="text-xs text-gray-500 mt-1">{m.user.email}</div>
                        )}
                      </td>
                      <td className="py-3 pr-3 break-words text-gray-700 leading-relaxed">
                        {m.notes || "-"}
                      </td>
                      <td className="py-3">
                        {canReverse ? (
                          <button
                            onClick={() => openReverseModal(m)}
                            disabled={reversingMovementId === m.id}
                            className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-xs font-semibold px-2 py-1 rounded"
                          >
                            {reversingMovementId === m.id ? "Desfazendo..." : "Desfazer"}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {alreadyReversed ? "Já desfeita" : "Indisponível"}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "annualLimit"}
        title="Configurar Limite Anual por Funcionário"
        onClose={closeModal}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Defina o limite padrão de retirada de uniformes por funcionário no ano.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Limite anual</label>
            <input
              type="number"
              min="1"
              step="1"
              className="border rounded px-3 py-2 w-full"
              value={annualLimitInput}
              onChange={(e) => setAnnualLimitInput(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveAnnualLimit}
              disabled={savingAnnualLimit}
              className="bg-slate-700 hover:bg-slate-800 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded"
            >
              {savingAnnualLimit ? "Salvando..." : "Salvar Configuração"}
            </button>
            <button
              onClick={closeModal}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={modal.open && modal.type === "reverse"}
        title="Desfazer Movimentação"
        onClose={closeModal}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Informe a justificativa para desfazer a movimentação selecionada.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Justificativa (obrigatória)
            </label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={reverseReason}
              onChange={(e) => setReverseReason(e.target.value)}
              placeholder="Descreva o motivo do desfazer"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleReverseMovement}
              disabled={reversingMovementId === reverseTarget?.id}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold px-4 py-2 rounded"
            >
              {reversingMovementId === reverseTarget?.id ? "Desfazendo..." : "Confirmar Desfazer"}
            </button>
            <button
              onClick={closeModal}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded"
            >
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

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

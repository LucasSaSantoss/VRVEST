import { useEffect, useMemo, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const STATUS_RETIRADA_LABEL = {
  OPEN: "Aberta",
  PARTIAL_RETURN: "Devolução Parcial",
  RETURNED: "Devolução Total",
  CHARGEABLE: "Com Cobrança",
  EXEMPT: "Extra",
  SETTLED_DISCOUNT: "Baixa Financeira",
  SETTLED_RETURN: "Devolução Total",
  REGULAR: "Retirada",
};

export default function DevolucaoUniformes() {
  const [cpf, setCpf] = useState("");
  const [summary, setSummary] = useState(null);
  const [stockOptions, setStockOptions] = useState([]);
  const [returnQtyMap, setReturnQtyMap] = useState({});
  const [legacyItemId, setLegacyItemId] = useState("");
  const [legacyStockId, setLegacyStockId] = useState("");
  const [legacyQty, setLegacyQty] = useState("1");
  const [legacyNotes, setLegacyNotes] = useState("");
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

  const carregarOpcoesDevolucaoLegada = async () => {
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
        const summaryData = res.data.data;
        setSummary(summaryData);
        const defaultQtyMap = {};
        (summaryData.openWithdrawals || []).forEach((withdrawal) => {
          (withdrawal.items || []).forEach((item) => {
            defaultQtyMap[item.id] = Number(item.pendingQuantity || 0);
          });
        });
        setReturnQtyMap(defaultQtyMap);
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
    carregarOpcoesDevolucaoLegada();
  }, []);

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11 && cpfDigits !== lastAutoCpfSearched) {
      setLastAutoCpfSearched(cpfDigits);
      carregarRetiradasEmAberto(cpfDigits);
    }
  }, [cpf, lastAutoCpfSearched]);

  const legacyProductOptions = useMemo(() => {
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

  const legacySizeOptionsByProduct = useMemo(
    () => stockOptions.filter((entry) => String(entry.itemId) === String(legacyItemId)),
    [stockOptions, legacyItemId]
  );

  const legacySelectedStock = useMemo(
    () => stockOptions.find((entry) => String(entry.id) === String(legacyStockId)) || null,
    [stockOptions, legacyStockId]
  );

  const registrarDevolucaoItem = async (withdrawal, item) => {
    const quantidadeInformada = Number(returnQtyMap[item.id] ?? item.pendingQuantity ?? 0);
    if (!Number.isFinite(quantidadeInformada) || quantidadeInformada <= 0) {
      showTemporaryPopup("Informe uma quantidade válida para devolução.", "error");
      return;
    }

    if (quantidadeInformada > Number(item.pendingQuantity || 0)) {
      showTemporaryPopup("A quantidade não pode ser maior que o pendente do item.", "error");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post(`/uniforms/withdrawals/${withdrawal.id}/return`, {
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

  const registrarDevolucaoLegada = async () => {
    if (!summary?.employee?.cpf) {
      showTemporaryPopup("Busque o colaborador antes de registrar devolução legada.", "error");
      return;
    }

    const qty = Number(legacyQty || 0);
    if (!legacyStockId || qty <= 0) {
      showTemporaryPopup("Selecione item/tamanho e informe quantidade válida.", "error");
      return;
    }

    if (!legacyNotes || !legacyNotes.trim()) {
      showTemporaryPopup("Justificativa obrigatória para devolução legada.", "error");
      return;
    }

    setProcessing(true);
    try {
      const res = await api.post("/uniforms/returns/legacy", {
        cpf: summary.employee.cpf,
        uniformStockSizeId: Number(legacyStockId),
        quantity: qty,
        notes: legacyNotes.trim(),
      });

      if (res.data?.success) {
        const emailNotification = res.data?.emailNotification;
        if (emailNotification?.success === false) {
          showTemporaryPopup(
            `${res.data?.message || "Devolução legada registrada com sucesso."} ${emailNotification.message || ""}`.trim(),
            "error"
          );
        } else {
          showTemporaryPopup(
            `${res.data?.message || "Devolução legada registrada com sucesso."} ${emailNotification?.message || ""}`.trim(),
            "success"
          );
        }

        setLegacyItemId("");
        setLegacyStockId("");
        setLegacyQty("1");
        setLegacyNotes("");

        await carregarRetiradasEmAberto(summary.employee.cpf);
        await carregarOpcoesDevolucaoLegada();
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao registrar devolução legada."),
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
            <p className="text-base text-red-600 font-bold animate-pulse">Nenhuma retirada pendente para este colaborador.</p>
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
                          className="border rounded px-2 py-1 md:max-w-[110px]"
                          placeholder="Qtd devolver"
                          value={returnQtyMap[item.id] ?? item.pendingQuantity ?? ""}
                          onChange={(e) =>
                            setReturnQtyMap((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                        />
                        <button
                          onClick={() => registrarDevolucaoItem(w, item)}
                          disabled={processing}
                          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-semibold px-3 py-1.5 rounded md:justify-self-start"
                        >
                          {processing ? "Aguarde..." : "Registrar Devolução"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {(summary.openWithdrawals || []).length === 0 && (
            <div className="mt-4 border-t pt-4">
              <h4 className="font-semibold text-gray-700 mb-2">
                Devolução sem retirada registrada
              </h4>
              {/* [MANUTENCAO] Motivo: substituir termo técnico e destacar quando esta opção deve ser utilizada. */}
              {/* [MANUTENCAO] Impacto: altera somente textos da interface; o fluxo interno de devolução legada permanece inalterado. */}
              {/* [MANUTENCAO] Data: 2026-06-22 */}
              {/* [MANUTENCAO] Autor: Márlon Etiene */}
              <p className="text-sm text-red-600 font-bold mb-3 animate-pulse">
                Atenção: use esta opção somente quando o uniforme estiver sendo devolvido,
                mas a retirada não aparecer no sistema.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-2">
                <select
                  className="border rounded px-3 py-2"
                  value={legacyItemId}
                  onChange={(e) => {
                    setLegacyItemId(e.target.value);
                    setLegacyStockId("");
                  }}
                >
                  <option value="">Selecione o uniforme/produto</option>
                  {legacyProductOptions.map((p) => (
                    <option key={p.itemId} value={p.itemId}>
                      {p.itemName}
                    </option>
                  ))}
                </select>
                <select
                  className="border rounded px-3 py-2"
                  value={legacyStockId}
                  onChange={(e) => setLegacyStockId(e.target.value)}
                  disabled={!legacyItemId}
                >
                  <option value="">{legacyItemId ? "Selecione o tamanho" : "..."}</option>
                  {legacySizeOptionsByProduct.map((s) => (
                    <option key={s.id} value={s.id}>
                      Tam {s.size}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  className="border rounded px-3 py-2"
                  value={legacyQty}
                  onChange={(e) => setLegacyQty(e.target.value)}
                  placeholder="Quantidade"
                />
              </div>
              {legacySelectedStock && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2 text-sm">
                  <div className="bg-gray-50 border rounded px-3 py-2">
                    <span className="text-gray-600">Produto:</span>{" "}
                    <strong>{legacySelectedStock.item?.itemName || "-"}</strong>
                  </div>
                  <div className="bg-gray-50 border rounded px-3 py-2">
                    <span className="text-gray-600">Estoque Principal:</span>{" "}
                    <strong>{Number(legacySelectedStock.qtyMainStock || 0)}</strong>
                  </div>
                  <div className="bg-gray-50 border rounded px-3 py-2">
                    <span className="text-gray-600">Estoque Empréstimos:</span>{" "}
                    <strong>{Number(legacySelectedStock.qtyLoanStock || 0)}</strong>
                  </div>
                </div>
              )}
              <label
                htmlFor="justificativa-devolucao-sem-retirada"
                className="block text-sm text-red-600 font-bold mb-1 animate-pulse"
              >
                Justificativa obrigatória: informe por que a retirada não foi registrada.
              </label>
              <textarea
                id="justificativa-devolucao-sem-retirada"
                className="border border-red-500 rounded px-3 py-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                rows={2}
                value={legacyNotes}
                onChange={(e) => setLegacyNotes(e.target.value)}
                placeholder="Digite a justificativa"
              />
              <button
                onClick={registrarDevolucaoLegada}
                disabled={processing}
                className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold px-3 py-2 rounded"
              >
                {processing ? "Aguarde..." : "Registrar Devolução"}
              </button>
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

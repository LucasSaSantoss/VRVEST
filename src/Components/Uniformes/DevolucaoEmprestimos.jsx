import { useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

export default function DevolucaoEmprestimos() {
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

  const loadSummary = async (cpfValue) => {
    const cpfBusca = String(cpfValue ?? cpf).trim();
    if (!cpfBusca) {
      showTemporaryPopup("Informe o CPF do colaborador.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.get(`/uniforms/loan/employee/${cpfBusca}/summary`);
      if (res.data?.success) {
        const data = res.data.data;
        setSummary(data);
        const defaultQtyMap = {};
        (data.openLoans || []).forEach((loan) => {
          (loan.items || []).forEach((item) => {
            defaultQtyMap[item.id] = Number(item.pendingQuantity || 0);
          });
        });
        setReturnQtyMap(defaultQtyMap);
      }
    } catch (error) {
      setSummary(null);
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao carregar empréstimos."), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cpfDigits = String(cpf || "").replace(/\D/g, "");
    if (cpfDigits.length === 11 && cpfDigits !== lastAutoCpfSearched) {
      setLastAutoCpfSearched(cpfDigits);
      loadSummary(cpfDigits);
    }
  }, [cpf, lastAutoCpfSearched]);

  const registrarDevolucaoItem = async (loan, item) => {
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
      const res = await api.post(`/uniforms/loan/${loan.id}/return`, {
        items: [
          {
            uniformLoanItemId: item.id,
            quantity: quantidadeInformada,
          },
        ],
      });

      if (res.data?.success) {
        showTemporaryPopup(res.data.message || "Devolução registrada com sucesso.", "success");
        await loadSummary(summary?.employee?.cpf || cpf);
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
        <h2 className="text-xl font-bold text-gray-800">Devolução de Empréstimos</h2>
        <p className="text-gray-600 text-sm">Consulta por CPF e recebimento item a item de empréstimos.</p>
      </div>

      <section className="bg-white rounded-xl shadow p-4 mb-3">
        <h3 className="font-semibold text-gray-700 mb-2">Buscar Colaborador</h3>
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
        <section className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3">Empréstimos em Aberto</h3>
          <p className="text-sm mb-3">
            <strong>Colaborador:</strong> {summary.employee?.name} ({summary.employee?.cpf})
          </p>

          {(summary.openLoans || []).length === 0 ? (
            <p className="text-sm text-gray-600">Nenhum empréstimo pendente para este colaborador.</p>
          ) : (
            <div className="space-y-4">
              {summary.openLoans.map((loan) => (
                <div key={loan.id} className="border rounded-lg p-3">
                  <div className="text-sm mb-2">
                    <strong>Empréstimo:</strong> #{loan.id} | <strong>Data:</strong>{" "}
                    {new Date(loan.loanDate).toLocaleString("pt-BR")}
                  </div>

                  <div className="space-y-2">
                    {loan.items.map((item) => (
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
                          onClick={() => registrarDevolucaoItem(loan, item)}
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
            Aguarde... processando devolução.
          </div>
        </div>
      )}
    </div>
  );
}

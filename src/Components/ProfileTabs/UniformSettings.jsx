import { useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

export default function UniformSettings() {
  const [annualLimitPlantonista, setAnnualLimitPlantonista] = useState(1);
  const [annualLimitDiarista, setAnnualLimitDiarista] = useState(2);
  const [annualLimitPlantonistaInput, setAnnualLimitPlantonistaInput] = useState("1");
  const [annualLimitDiaristaInput, setAnnualLimitDiaristaInput] = useState("2");
  const [allowZeroOrNegativeStockMovement, setAllowZeroOrNegativeStockMovement] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const carregarConfiguracao = async () => {
    setLoading(true);
    try {
      const res = await api.get("/uniforms/settings");
      if (res.data?.success) {
        const limitPlantonista = Number(
          res.data.data?.annualLimitPlantonista || res.data.data?.annualLimit || 1
        );
        const limitDiarista = Number(
          res.data.data?.annualLimitDiarista || res.data.data?.annualLimit || 2
        );
        setAnnualLimitPlantonista(limitPlantonista);
        setAnnualLimitDiarista(limitDiarista);
        setAnnualLimitPlantonistaInput(String(limitPlantonista));
        setAnnualLimitDiaristaInput(String(limitDiarista));
        setAllowZeroOrNegativeStockMovement(
          Number(res.data.data?.allowZeroOrNegativeStockMovement || 0) === 1
        );
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao carregar configuração de uniformes."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregarConfiguracao();
  }, []);

  const salvarConfiguracoes = async () => {
    try {
      const parsedPlantonista = Number(annualLimitPlantonistaInput);
      const parsedDiarista = Number(annualLimitDiaristaInput);
      if (!Number.isInteger(parsedPlantonista) || parsedPlantonista <= 0) {
        showTemporaryPopup("Informe limite de plantonista inteiro maior que zero.", "error");
        return;
      }
      if (!Number.isInteger(parsedDiarista) || parsedDiarista <= 0) {
        showTemporaryPopup("Informe limite de diarista inteiro maior que zero.", "error");
        return;
      }

      setSaving(true);
      const [limitRes, policyRes] = await Promise.all([
        api.put("/uniforms/settings/annual-limit", {
          annualLimitPlantonista: parsedPlantonista,
          annualLimitDiarista: parsedDiarista,
          annualLimit: parsedDiarista,
        }),
        api.put("/uniforms/settings/stock-movement-policy", {
          allowZeroOrNegativeStockMovement,
        }),
      ]);

      if (limitRes.data?.success && policyRes.data?.success) {
        setAnnualLimitPlantonista(parsedPlantonista);
        setAnnualLimitDiarista(parsedDiarista);
        showTemporaryPopup("Configurações de uniformes atualizadas com sucesso.", "success");
      }
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao atualizar configurações de uniformes."),
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white shadow-xl rounded-2xl max-w-full max-h-full mx-auto p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300 ease-in-out">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Configuração de Uniformes
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Defina limites e regras operacionais do módulo de uniformes.
      </p>

      {loading ? (
        <p className="text-sm text-gray-600">Carregando configuração...</p>
      ) : (
        <div className="space-y-6">
          <div className="text-sm text-gray-700">
            Limite atual plantonista/ano: <strong>{annualLimitPlantonista}</strong>
            <br />
            Limite atual diarista/ano: <strong>{annualLimitDiarista}</strong>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
            <div className="flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Limite anual plantonista</label>
              <input
                type="number"
                min="1"
                step="1"
                value={annualLimitPlantonistaInput}
                onChange={(e) => setAnnualLimitPlantonistaInput(e.target.value)}
                className="bg-white border rounded-lg h-11 px-4 text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-gray-700 font-medium mb-1">Limite anual diarista</label>
              <input
                type="number"
                min="1"
                step="1"
                value={annualLimitDiaristaInput}
                onChange={(e) => setAnnualLimitDiaristaInput(e.target.value)}
                className="bg-white border rounded-lg h-11 px-4 text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 max-w-2xl">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4"
                checked={allowZeroOrNegativeStockMovement}
                onChange={(e) => setAllowZeroOrNegativeStockMovement(e.target.checked)}
              />
              <div>
                <p className="font-medium text-gray-800">
                  Permitir movimentação com estoque zerado ou negativo
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Quando ativo, retiradas e ajustes poderão reduzir saldo para zero ou abaixo de zero.
                  Use apenas em contingência operacional.
                </p>
              </div>
            </label>
          </div>

          <button
            type="button"
            onClick={salvarConfiguracoes}
            disabled={saving}
            className="max-w-[260px] bg-green-600 text-white font-semibold py-2.5 px-4 rounded-lg hover:bg-green-700 hover:shadow-md active:scale-[0.98] transition-all disabled:bg-green-400"
          >
            {saving ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      )}

      {popup.show && (
        <div
          className={`fixed top-5 right-5 z-[70] px-5 py-3 rounded-lg shadow-lg text-white ${
            popup.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {popup.message}
        </div>
      )}
    </div>
  );
}

import { useMemo } from "react";

export default function GraficoCautelasLegadas({ values = [], loading = false }) {
  const totais = useMemo(() => {
    // [MANUTENCAO] Motivo: resumir cautelas abertas reais no dashboard por faixa de vencimento.
    // [MANUTENCAO] Impacto: conta retiradas abertas normais e anteriores, sem depender da planilha histórica.
    // [MANUTENCAO] Data: 2026-06-26
    // [MANUTENCAO] Autor: Márlon Etiene
    return values.reduce(
      (acc, item) => {
        const diasParaVencer = Number(item.diasParaVencer);

        if (item.vencido) {
          acc.vencidas += 1;
          return acc;
        }

        if (Number.isFinite(diasParaVencer) && diasParaVencer <= 30) {
          acc.ateTrintaDias += 1;
          return acc;
        }

        if (Number.isFinite(diasParaVencer) && diasParaVencer < 90) {
          acc.deTrintaUmAOitentaNoveDias += 1;
          return acc;
        }

        if (Number.isFinite(diasParaVencer) && diasParaVencer >= 90) {
          acc.noventaDiasOuMais += 1;
        }

        return acc;
      },
      {
        vencidas: 0,
        ateTrintaDias: 0,
        deTrintaUmAOitentaNoveDias: 0,
        noventaDiasOuMais: 0,
      }
    );
  }, [values]);

  const cards = [
    {
      label: "Vencidas",
      value: totais.vencidas,
      container: "bg-red-50 border-red-100",
      text: "text-red-800",
      badge: "bg-red-600",
    },
    {
      label: "Até 30 dias",
      value: totais.ateTrintaDias,
      container: "bg-yellow-50 border-yellow-100",
      text: "text-yellow-800",
      badge: "bg-yellow-500",
    },
    {
      label: "31 a 89 dias",
      value: totais.deTrintaUmAOitentaNoveDias,
      container: "bg-blue-50 border-blue-100",
      text: "text-blue-800",
      badge: "bg-blue-600",
    },
    {
      label: "90 dias ou mais",
      value: totais.noventaDiasOuMais,
      container: "bg-green-50 border-green-100",
      text: "text-green-800",
      badge: "bg-green-600",
    },
  ];

  return (
    <div className="bg-white shadow-lg rounded-2xl w-full min-h-[19rem] p-4 mt-1 overflow-hidden">
      <p className="text-md font-bold text-gray-800 text-center">
        Validade de Cautelas
      </p>
      <p className="mx-auto max-w-[360px] text-[11px] leading-snug text-gray-500 text-center mb-2">
        Cautelas abertas de retiradas normais e registros anteriores.
      </p>

      <div className="w-full">
        {loading ? (
          <div className="min-h-[14.5rem] flex items-center justify-center text-sm text-gray-500">
            Carregando cautelas...
          </div>
        ) : (
          <div className="flex flex-col justify-center gap-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`mx-auto flex w-full max-w-[300px] items-center justify-center rounded-2xl border px-4 py-2.5 ${card.container}`}
              >
                <div className="flex w-full items-center justify-between gap-4">
                  <span className={`text-sm font-semibold tracking-wide ${card.text}`}>
                    {card.label}
                  </span>
                  <span
                    className={`min-w-12 rounded-full px-3 py-1 text-center text-sm font-bold text-white shadow ${card.badge}`}
                  >
                    {card.value}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

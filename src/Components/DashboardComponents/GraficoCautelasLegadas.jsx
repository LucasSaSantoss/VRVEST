import { useMemo } from "react";

export default function GraficoCautelasLegadas({ values = [], loading = false }) {
  const totais = useMemo(() => {
    // [MANUTENCAO] Motivo: resumir cautelas históricas no dashboard por faixa de vencimento.
    // [MANUTENCAO] Impacto: usa dados já calculados pela consulta histórica, sem alterar regras do backend.
    // [MANUTENCAO] Data: 2026-06-10
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
    <div className="bg-white shadow-lg rounded-2xl w-full h-[19rem] p-4 mt-1">
      <p className="text-md font-bold text-gray-800 mb-3 text-center">
        Vencimento de Cautelas
      </p>

      <div className="w-full h-[15rem]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            Carregando cautelas...
          </div>
        ) : (
          <div className="h-full flex flex-col justify-center gap-3">
            {cards.map((card) => (
              <div
                key={card.label}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${card.container}`}
              >
                <span className={`text-sm font-semibold tracking-wide ${card.text}`}>
                  {card.label}
                </span>
                <span
                  className={`min-w-12 rounded-full px-3 py-1 text-center text-sm font-bold text-white shadow ${card.badge}`}
                >
                  {card.value}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

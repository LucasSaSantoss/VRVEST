import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function GraficoCautelasLegadas({ values = [], loading = false }) {
  const totais = useMemo(() => {
    // [MANUTENCAO] Motivo: resumir cautelas históricas no dashboard por faixa de vencimento.
    // [MANUTENCAO] Impacto: usa dados já calculados pela consulta legada, sem alterar regras do backend.
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
          acc.ateUmMes += 1;
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
        ateUmMes: 0,
        deTrintaUmAOitentaNoveDias: 0,
        noventaDiasOuMais: 0,
      }
    );
  }, [values]);

  const data = {
    labels: ["Vencidas", "Até 30 dias", "31 a 89 dias", "90 dias ou mais"],
    datasets: [
      {
        label: "Cautelas históricas",
        data: [
          totais.vencidas,
          totais.ateUmMes,
          totais.deTrintaUmAOitentaNoveDias,
          totais.noventaDiasOuMais,
        ],
        backgroundColor: ["#DC2626", "#EAB308", "#2563EB", "#16A34A"],
        borderRadius: 8,
        maxBarThickness: 56,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "#1f2937",
        titleColor: "#fff",
        bodyColor: "#fff",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "#e5e7eb" },
        ticks: { precision: 0, color: "#374151" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#374151" },
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl w-full h-[19rem] p-2 mt-1">
      <p className="text-md font-bold text-gray-800 mb-1 text-center">
        Vencimento de Cautelas
      </p>
      <p className="text-xs text-gray-500 text-center mb-2">
        {/*Faixas não cumulativas por prazo de vencimento.*/}
      </p>

      <div className="w-full h-[15.5rem]">
        {loading ? (
          <div className="h-full flex items-center justify-center text-sm text-gray-500">
            Carregando cautelas...
          </div>
        ) : (
          <Bar data={data} options={options} />
        )}
      </div>
    </div>
  );
}

// src/components/GraficoDoughnut.jsx
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Registrar os elementos necessários
ChartJS.register(ArcElement, Tooltip, Legend);

export default function GraficoDoughnut({ values }) {
  const contagens = values.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});

  // Labels e valores do gráfico
  const labels = Object.keys(contagens);
  const dataValues = Object.values(contagens);

  const cores = {
    "Em aberto": "rgba(8, 78, 230, 0.69)",
    Atrasado: "rgba(252, 5, 5, 0.84)",
    Devolvido: "rgba(18, 218, 28, 0.69)",
    Desconhecido: "rgba(201, 203, 207, 0.6)",
  };

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Status dos Kits",
        data: dataValues,
        backgroundColor: labels.map(
          (label) => cores[label] || "rgba(150,150,150,0.5)"
        ),
        borderColor: labels.map(() => "rgba(255,255,255,1)"),
        borderWidth: 2,
        hoverOffset: 10,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // <- permite adaptar ao container
    plugins: {
      legend: {
        position: "right",
        labels: {
          color: "#333",
          font: { size: 12 },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0,0,0,0.7)",
        padding: 10,
      },
    },
  };

  return (
    <div className="grid grid-auto-rows h-[296px] bg-white rounded-xl shadow-xl mt-6">
      <p className="text-center font-bold mt-5">Distribuição dos Kits</p>
      <div className="flex-1">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

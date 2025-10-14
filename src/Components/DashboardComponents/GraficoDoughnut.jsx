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

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Status dos Kits",
        data: dataValues,
        backgroundColor: [
          "rgba(63, 66, 218, 1)", // azul
          "rgba(19, 179, 40, 1)", // verde
          "rgb(255, 99, 132)", // vermelho
        ],
        borderWidth: 2,
        hoverOffset: 25,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // <- permite adaptar ao container
    plugins: {
      legend: {
        position: "bottom",
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
    <div className="w-full md:w-[50%] md:h-140 bg-transparent rounded-xl shadow-xl flex flex-col justify-center ml-5 mt-5">
      <h3 className="text-lg mt-3 p-2 font-bold text-center mb-2">
        Distribuição de Kits
      </h3>
      <div className="flex-1">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { addHours } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function MovPorHora({ values = [] }) {
  const chartRef = useRef(null);
  const hoje = new Date();
  console.log(values);
  const carregaHoras = () => {
    const horas = [];

    for (let i = 23; i >= 0; i--) {
      const hora = new Date(hoje.getTime() - i * 60 * 60 * 1000);
      const horaLabel = hora.getHours().toString().padStart(2, "0") + "h";
      horas.push(horaLabel);
    }
    return horas;
  };

  const labels = carregaHoras();

  // Dados iniciais
  const [data, setData] = useState({
    labels,
    datasets: [
      {
        label: "Retirados",
        data: labels.map(() => 0),
        borderColor: "rgba(226, 195, 20, 1)",
        backgroundColor: "rgba(219, 216, 15, 0.74)",
        tension: 0.3,
        fill: true,
      },
      {
        label: "Devolvidos",
        data: labels.map(() => 0),
        borderColor: "rgba(20, 214, 52, 1)",
        backgroundColor: "rgba(10, 197, 19, 0.83)",
        tension: 0.3,
        fill: true,
      },
    ],
  });

  useEffect(() => {
    if (!Array.isArray(values) || values.length === 0) return;

    const retiradosPorHora = Array(24).fill(0);
    const devolvidosPorHora = Array(24).fill(0);

    values.forEach((item) => {
      if (
        item.status === "Em aberto" ||
        item.status === "Pendente" ||
        item.status === "Atrasado"
      ) {
        const dataMov = item.data ? addHours(new Date(item.data), 3) : null;
        if (!dataMov) return;
        console.log(dataMov);
        const diffHoras = Math.floor((hoje - dataMov) / (1000 * 60 * 60));
        if (diffHoras < 24 && diffHoras >= 0) {
          const index = 23 - diffHoras;

          retiradosPorHora[index]++;
        }
      }

      if (item.dataDevolucao) {
        const dataMov = addHours(new Date(item.dataDevolucao), 3);

        if (!dataMov) return;

        const diffHoras = Math.floor((hoje - dataMov) / (1000 * 60 * 60)); //Cálculo da hora em que foi retirado
        const diffHorasDevol = Math.floor((hoje - dataMov) / (1000 * 60 * 60)); //Cálculo da hora em que foi devolvido
        if (diffHorasDevol < 24 && diffHorasDevol >= 0) {
          const index = 23 - diffHorasDevol;
          devolvidosPorHora[index]++;
        }
        if (diffHoras < 24 && diffHoras >= 0) {
          //Toda devolução foi retirada inicialmente, então preciso adicionar uma retirada também em cada devolução caso os parâmetros sejam satisfeitos;
          const index = 23 - diffHoras;

          retiradosPorHora[index]++;
        }
      }
    });

    console.log(retiradosPorHora);
    console.log(devolvidosPorHora);
    setData({
      labels,
      datasets: [
        {
          label: "Retirados",
          data: retiradosPorHora,
          borderColor: "rgba(240, 236, 32, 0.74)",
          backgroundColor: "rgba(231, 228, 32, 0.91)",
          tension: 0.3,
          fill: true,
        },
        {
          label: "Devolvidos",
          data: devolvidosPorHora,
          borderColor: "rgba(42, 228, 73, 1)",
          backgroundColor: "rgba(34, 228, 44, 0.86)",
          tension: 0.3,
          fill: true,
        },
      ],
    });
  }, [values]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
        labels: { color: "#374151", font: { size: 12 } },
      },
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
        ticks: { color: "#374151" },
      },
      x: {
        grid: { display: false },
        ticks: { color: "#374151" },
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-2xl w-full h-[204px] p-2 mt-1">
      <p className="text-md font-bold text-gray-800 mb-2 text-center">
        Retirados e Devolvidos (Últimas 24 hrs)
      </p>

      <div className="w-full h-[160px]">
        <Line ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

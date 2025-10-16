import { useState, useRef, useEffect } from "react";
import {
  Chart as ChartJS,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

// Registrar componentes do Chart.js
ChartJS.register(
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

export default function RetiradosEDevolvidos({ values = [] }) {
  const chartRef = useRef(null);

  const carregaMeses = (qtd) => {
    const meses = [];
    const hoje = new Date();

    for (let i = qtd; i >= 0; i--) {
      const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesAbrev = data.toLocaleString("pt-BR", { month: "short" });
      meses.push(mesAbrev.charAt(0).toUpperCase() + mesAbrev.slice(1));
    }
    return meses;
  };

  const labels = carregaMeses(5);

  useEffect(() => {
    if (!Array.isArray(values) || values.length === 0) return;

    const hoje = new Date();

    // Mapeia cada mês dos últimos 6 meses
    const retiradosPorMes = Array(6).fill(0);
    const devolvidosPorMes = Array(6).fill(0);

    values.forEach((item) => {
      let dataRetirada = null;
      let dataDevolucao = null;
      if (
        item.status === "Em aberto" ||
        item.status === "Pendente" ||
        item.status === "Atrasado"
      ) {
        dataRetirada = item.data ? new Date(item.data) : null;
      } else {
        dataDevolucao = item.data ? new Date(item.data) : null;
      }

      for (let i = 0; i < 6; i++) {
        const mesRef = new Date(
          hoje.getFullYear(),
          hoje.getMonth() - (5 - i),
          1
        );

        if (
          dataRetirada &&
          dataRetirada.getMonth() === mesRef.getMonth() &&
          dataRetirada.getFullYear() === mesRef.getFullYear()
        ) {
          retiradosPorMes[i]++;
        }

        if (
          dataDevolucao &&
          dataDevolucao.getMonth() === mesRef.getMonth() &&
          dataDevolucao.getFullYear() === mesRef.getFullYear()
        ) {
          devolvidosPorMes[i]++;
        }
      }
    });

    setData({
      labels,
      datasets: [
        {
          label: "Retirados",
          data: retiradosPorMes,
          borderColor: "rgba(226, 195, 20, 1)",
          backgroundColor: "rgba(219, 216, 15, 0.74)",
        },
        {
          label: "Devolvidos",
          data: devolvidosPorMes,
          borderColor: "rgba(20, 214, 52, 1)",
          backgroundColor: "rgba(10, 197, 19, 0.83)",
        },
      ],
    });
  }, [values]);

  // Dados iniciais
  const [data, setData] = useState({
    labels,
    datasets: [
      {
        label: "Retirados",
        data: labels.map(() => 0),
        borderColor: "rgba(226, 195, 20, 1)",
        backgroundColor: "rgba(219, 216, 15, 0.74)",
        tension: 0.4,
      },
      {
        label: "Devolvidos",
        data: labels.map(() => 0),
        borderColor: "rgba(20, 214, 52, 1)",
        backgroundColor: "rgba(10, 197, 19, 0.83)",
        tension: 0.2,
      },
    ],
  });

  const options = {
    responsive: true,
    interaction: {
      mode: "nearest",
      intersect: false,
      axis: "x",
    },
    plugins: {
      legend: {
        display: true,
        position: "bottom",
        labels: {
          color: "#374151",
          font: { size: 14 },
        },
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
    <div className="bg-white shadow-lg rounded-2xl w-full h-[370px] flex flex-col mt-2">
      <h2 className="text-xl font-bold text-gray-800 mb-3 text-center">
        Retirados e Devolvidos (Últimos 6 Meses)
      </h2>

      <div className="h-full w-full">
        <Bar ref={chartRef} data={data} options={options} />
      </div>
    </div>
  );
}

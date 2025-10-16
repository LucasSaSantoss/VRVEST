import { Line } from "react-chartjs-2";
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

export default function GraficoLinha() {
  const data = {
    labels: ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"],
    datasets: [
      {
        label: "Registros",
        data: [5, 8, 6, 10, 9, 12, 7],
        borderColor: "rgba(59,130,246,1)", // azul Tailwind 500
        backgroundColor: "rgba(59,130,246,0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // ⚠️ ESSENCIAL para definir altura manualmente
    plugins: {
      legend: {
        position: "top",
        labels: { color: "#374151" },
      },
    },
    scales: {
      x: {
        ticks: { color: "#374151" },
        grid: { display: false },
      },
      y: {
        ticks: { color: "#374151" },
        grid: { color: "#e5e7eb" },
      },
    },
  };

  return (
    <div className="w-full h-[200px] bg-white shadow-md rounded-2xl p-4 mt-2">
      <Line data={data} options={options} />
    </div>
  );
}

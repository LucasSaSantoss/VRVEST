// src/components/GraficoMovimentacao.jsx
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function GraficoMovimentacao({ dados }) {
  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h3 className="text-lg font-semibold mb-3">Movimentação Semanal</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={dados}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="dia" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="retiradas" stroke="#3b82f6" />
          <Line type="monotone" dataKey="devolucoes" stroke="#10b981" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

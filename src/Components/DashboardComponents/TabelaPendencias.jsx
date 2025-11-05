// src/components/TabelaPendencias.jsx
import React from "react";
export default function TabelaPendencias({
  pendencias,
  filtroStatus,
  onLimparFiltro,
}) {
  const getStatusCor = (status) => {
    switch (status) {
      case "Em aberto":
        return "text-blue-600 bg-blue-100";
      case "Atrasado":
        return "text-red-600 bg-red-100";
      case "Devolvido":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-2 w-[45%] ">
      {/* Cabeçalho da tabela */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Pendências de Kits</h3>

        {/* Botão só aparece quando há um filtro */}
        {filtroStatus && (
          <button
            onClick={onLimparFiltro}
            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
          >
            Mostrar todos
          </button>
        )}
      </div>

      <div className="h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100 rounded-lg">
        <table className="w-[100%] text-left border-t border-gray-200 ">
          <thead>
            <tr className="text-gray-700 border-b text-xl items-center">
              <th className="py-2 px-2">Colaborador</th>
              <th className="py-2 px-3">Setor</th>
              <th className="py-2 px-2">Retirado em</th>
              <th className="py-2 px-8 ">Status</th>
              <th className="py-2 px-2">Tempo</th>
            </tr>
          </thead>
          <tbody>
            {pendencias.length > 0 ? (
              pendencias.map((p, i) => (
                <tr
                  key={i}
                  className="border-b hover:bg-gray-50 transition border-gray-200 text-sm items-center"
                >
                  <td className="py-2 px-2">{p.colaborador}</td>
                  <td className="py-2 ">{p.kit}</td>
                  <td className="py-2 px-2">
                    {new Date(
                      new Date(p.data).getTime() + 3 * 60 * 60 * 1000
                    ).toLocaleString("en-US")}
                  </td>
                  <td className="py-2 px-8">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusCor(
                        p.status
                      )}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-2 px-3">{p.tempo}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-4 text-gray-500">
                  Nenhuma pendência encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

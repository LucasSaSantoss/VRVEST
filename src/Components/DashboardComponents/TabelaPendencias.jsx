// src/components/TabelaPendencias.jsx
export default function TabelaPendencias({ pendencias }) {
  const getStatusCor = (status) => {
    switch (status) {
      case "Pendente":
        return "text-yellow-600 bg-yellow-100";
      case "Atrasado":
        return "text-red-600 bg-red-100";
      case "Devolvido":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 mt-6">
      <h3 className="text-lg font-semibold mb-3">Pendências de Kits</h3>
      <table className="min-w-full text-sm text-left border-t">
        <thead>
          <tr className="text-gray-700 border-b">
            <th className="py-2 px-3">Colaborador</th>
            <th className="py-2 px-3">Kit</th>
            <th className="py-2 px-3">Retirado em</th>
            <th className="py-2 px-3">Status</th>
            <th className="py-2 px-3">Tempo</th>
          </tr>
        </thead>
        <tbody>
          {pendencias.map((p, i) => (
            <tr key={i} className="border-b hover:bg-gray-50">
              <td className="py-2 px-3">{p.colaborador}</td>
              <td className="py-2 px-3">{p.kit}</td>
              <td className="py-2 px-3">{p.data}</td>
              <td className="py-2 px-3">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusCor(
                    p.status
                  )}`}
                >
                  {p.status}
                </span>
              </td>
              <td className="py-2 px-3">{p.tempo}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

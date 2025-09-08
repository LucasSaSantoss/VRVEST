import { useEffect, useState } from "react";
import carregarFuncionarios from "../../services/api";

export default function TabelaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [erro, setErro] = useState("");

  const handleFuncionarios = async (e) => {
      e.preventDefault();
  
      const data = await cadastrarUsuario({
        name,
        email,
        password,
        sector,
        position,
        level: parseInt(level),
      });
      setMensagem(data.message);
  
      setPopup({
        mostrar: true,
        mensagem: data.message,
        tipo: data.success ? "success" : "error",
      });
  
 
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-4">Funcionários</h1>

      {erro && <p className="text-red-500">{erro}</p>}

      <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden">
        <thead className="bg-gray-200">
          <tr>
            <th className="px-4 py-2 border">Nome</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Setor</th>
            <th className="px-4 py-2 border">Cargo</th>
            <th className="px-4 py-2 border">Ativo</th>
          </tr>
        </thead>
        <tbody>
          {funcionarios.map((f) => (
            <tr
              key={f.id}
              className="odd:bg-white even:bg-gray-50 hover:bg-blue-100 transition"
            >
              <td className="px-4 py-2 border">{f.name}</td>
              <td className="px-4 py-2 border">{f.email}</td>
              <td className="px-4 py-2 border">{f.sector}</td>
              <td className="px-4 py-2 border">{f.position}</td>
              <td className="px-4 py-2 border">
                {f.active ? "✅ Sim" : "❌ Não"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}}

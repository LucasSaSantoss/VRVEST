import { useEffect, useState } from "react";
import { carregarPendencias, atualizarPendencia } from "../../services/api";

export default function ListaPendencias() {
  const [pendencias, setPendencias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [sortColumn, setSortColumn] = useState("emplName");
  const [sortAsc, setSortAsc] = useState(true);
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // novo estado para guardar os itens selecionados
  const [selecionados, setSelecionados] = useState({});

  const registrosPorPagina = regPorPagina;
  const indiceUltimoRegistro = paginaAtual * registrosPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - registrosPorPagina;

  if (indiceUltimoRegistro === 0) {
    setPaginaAtual(1);
  }

  // Carregar pendências do backend
  const listarPendencias = async () => {
    const dados = await carregarPendencias();
    if (dados?.success) {
      setPendencias(dados.data);
    }
  };

  useEffect(() => {
    listarPendencias();
  }, []);

  // alternar seleção
  const toggleSelecionado = (id) => {
    setSelecionados((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Função Baixar (alterar status para 2)
  const baixarPendencias = async () => {
    const idsSelecionados = Object.keys(selecionados).filter(
      (id) => selecionados[id]
    );

    if (idsSelecionados.length === 0) {
      alert("Nenhuma pendência selecionada.");
      return;
    }

    try {
      for (let id of idsSelecionados) {
        await atualizarPendencia(id, { status: 2 });
      }

      // Atualiza no estado local (sem precisar chamar de novo o backend)
      setPendencias((prev) =>
        prev.map((p) =>
          idsSelecionados.includes(p.id.toString()) ? { ...p, status: 2 } : p
        )
      );

      // Limpa a seleção
      setSelecionados({});
      alert("Pendências baixadas com sucesso!");
    } catch (err) {
      console.error("Erro ao baixar pendências:", err);
      alert("Erro ao baixar pendências.");
    }
  };

  // Filtro por nome ou usuário
  const pendenciasFiltradas = pendencias.filter(
    (p) =>
      p.emplName?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.userName?.toLowerCase().includes(filtro.toLowerCase())
  );

  const registrosFiltrados = pendenciasFiltradas.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  return (
    <div className="p-4">
      {/* ... resto do código igual */}

      {/* Tabela de pendências */}
      <table className="min-w-full border-collapse border-b border-gray-300">
        <thead>
          <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
            <th className="py-2 px-4">Funcionário</th>
            <th className="py-2 px-4">Usuário</th>
            <th className="py-2 px-1">Data</th>
            <th className="py-2 px-1">Tamanho Kit</th>
            <th className="py-2 px-1">Baixa Financeira</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.map((p) => (
            <tr
              key={p.id}
              className={`text-center text-md hover:bg-blue-100 transition odd:bg-white even:bg-gray-100 cursor-pointer ${
                selecionados[p.id] ? "bg-blue-200" : ""
              }`}
              onClick={() => toggleSelecionado(p.id)}
            >
              <td className="py-2 px-4">{p.emplName}</td>
              <td className="py-2 px-4">{p.userName}</td>
              <td className="py-2 px-1">
                {new Date(p.date).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 px-1">{p.kitSize}</td>
              <td className="py-2 px-1">
                <input
                  type="checkbox"
                  checked={!!selecionados[p.id]}
                  readOnly
                  disabled={p.status !== 1}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* PAGINAÇÃO */}
      <div className="flex justify-end mt-4 gap-5">
        {/* ... botões de paginação */}
        <button
          onClick={baixarPendencias}
          className="px-8 py-1 bg-green-300 rounded hover:bg-green-400 ml-[30vw]"
        >
          Baixar
        </button>
      </div>
    </div>
  );
}

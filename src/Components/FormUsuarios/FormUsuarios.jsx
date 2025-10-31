import { useEffect, useState } from "react";
import CreateUser from "./CreateUsuario";
import AlterUser from "./AlterUsuarios";
import { FaRegEdit } from "react-icons/fa";

export default function TabelaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [showModalAlter, setShowModalAlter] = useState(false);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {
    buscarUsuarios();
  }, []);

  const buscarUsuarios = async () => {
    try {
      const res = await fetch(`${API_URL}/users`);
      const data = await res.json();
      setUsuarios(data);
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
    }
  };

  const usuariosFiltrados = usuarios.filter((u) =>
    [
      u.name,
      u.email,
      u.sector,
      u.position,
      u.level === 1 ? "OPERADOR" : u.level === 2 ? "SUPERVISOR" : "ADMIN",
    ].some((campo) => campo?.toLowerCase().includes(filtroNome.toLowerCase()))
  );

  const totalPaginas = Math.ceil(usuariosFiltrados.length / regPorPagina);
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = usuariosFiltrados.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  const editarUsuario = (user) => {
    setUsuarioSelecionado(user);
    setShowModalAlter(true);
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-10 mt-20">
        {/* Cabeçalho da página */}
        <div className="flex flex-col items-start mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Usuários Cadastrados
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie os usuários cadastrados no sistema
          </p>
        </div>

        {/* Barra de ação */}
        <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <button
            className="bg-[#27ae60] text-white px-4 py-2 rounded-lg font-medium hover:bg-green-800 transition w-full lg:w-auto"
            onClick={() => setShowModalCreate(true)}
          >
            + Novo Usuário
          </button>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <input
              type="text"
              placeholder="Buscar usuário..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="border bg-white w-full sm:w-[300px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />

            <div className="flex items-center text-sm">
              <label className="mr-2">Registros:</label>
              <select
                value={regPorPagina}
                onChange={(e) => {
                  setRegPorPagina(Number(e.target.value));
                  setPaginaAtual(1);
                }}
                className="border rounded px-2 py-1 focus:ring-2 focus:ring-cyan-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto shadow-md rounded-lg border border-gray-200 bg-white">
          <table className="min-w-full border-collapse text-sm sm:text-base">
            <thead className="bg-gray-100 text-gray-700 text-center font-semibold">
              <tr>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Setor</th>
                <th className="py-3 px-4">Cargo</th>
                <th className="py-3 px-4">Nível</th>
                <th className="py-3 px-4">Ativo</th>
                <th className="py-3 px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.length > 0 ? (
                registrosFiltrados.map((user) => (
                  <tr
                    key={user.id}
                    className="text-center text-gray-700 hover:bg-gray-300 odd:bg-white even:bg-gray-50 transition"
                  >
                    <td className="py-2 px-4">{user.name}</td>
                    <td className="py-2 px-4">{user.email}</td>
                    <td className="py-2 px-4">{user.sector}</td>
                    <td className="py-2 px-4">{user.position}</td>
                    <td className="py-2 px-4">
                      {user.level === 1
                        ? "OPERADOR"
                        : user.level === 2
                          ? "SUPERVISOR"
                          : "ADMIN"}
                    </td>
                    <td className="py-2 px-4">
                      {user.active === 1 ? "Sim" : "Não"}
                    </td>
                    <td className="py-2 px-4">
                      <button
                        onClick={() => editarUsuario(user)}
                        className="p-2 border border-cyan-600 rounded-lg hover:bg-cyan-600 hover:text-white transition"
                      >
                        <FaRegEdit />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center text-gray-500 py-6 italic"
                  >
                    Nenhum usuário encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
            disabled={paginaAtual === 1}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-sm sm:text-base">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Modal Criar Usuário */}
      {showModalCreate && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[70vw] lg:w-[50vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Cadastrar Usuário
              </h2>
              <button
                className="text-red-500 text-xl"
                onClick={() => setShowModalCreate(false)}
              >
                ✖
              </button>
            </div>
            <CreateUser onClose={buscarUsuarios} />
          </div>
        </div>
      )}

      {/* Modal Editar Usuário */}
      {showModalAlter && usuarioSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[70vw] lg:w-[50vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                Alterar Usuário
              </h2>
              <button
                className="text-red-500 text-xl"
                onClick={() => setShowModalAlter(false)}
              >
                ✖
              </button>
            </div>
            <AlterUser user={usuarioSelecionado} onClose={buscarUsuarios} />
          </div>
        </div>
      )}
    </>
  );
}

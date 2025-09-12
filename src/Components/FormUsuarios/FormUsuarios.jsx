import { useEffect, useState } from "react";
import CreateUser from "./CreateUsuario";
import AlterUser from "./AlterUsuarios";
import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

export default function TabelaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);

  const [showModalCreate, setShowModalCreate] = useState(false); // modal de cadastro
  const [showModalAlter, setShowModalAlter] = useState(false); // modal de alteração
  const [usuarioSelecionado, setUsuarioSelecionado] = useState(null);

  const registrosPorPagina = 10;
  const indiceUltimoRegistro = paginaAtual * registrosPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - registrosPorPagina;

  if (indiceUltimoRegistro === 0) {
    setPaginaAtual(1);
  }

  useEffect(() => {
    fetch("http://localhost:3000/users")
      .then((res) => res.json())
      .then((data) => setUsuarios(data))
      .catch((err) => console.error("Erro ao carregar usuários:", err));
  }, []);

  const usuariosFiltrados = usuarios.filter(
    (u) =>
      u.name.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.sector.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.position.toLowerCase().includes(filtroNome.toLowerCase()) ||
      (u.level === 1 ? "OPERADOR" : u.level === 2 ? "SUPERVISOR" : "")
        .toLowerCase()
        .includes(filtroNome.toLowerCase())
  );

  const usuariosPagina = usuariosFiltrados.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  const handleEditar = (user) => {
    setUsuarioSelecionado(user);
    setShowModalAlter(true);
  };

  return (
    <div className="p-4">
      {/* Título + Campo de busca */}
      <div className="flex flex-col items-start mb-4">
        <h1 className="text-4xl font-bold">Usuários Cadastrados</h1>
        <div className="justify-between w-full flex mt-4">
          <button
            className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
            onClick={() => setShowModalCreate(true)}
          >
            Novo Usuário
          </button>

          {/* MODAL CADASTRO */}
          {showModalCreate && (
            <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 transition-opacity duration-300 ease-out">
              <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-2xl font-bold">Cadastro de Usuário</h2>
                  <button
                    className="text-red-500 border-2 rounded font-bold text-xl hover:text-red-700 hover:scale-110 bg-red-500 transition duration-200"
                    onClick={() => setShowModalCreate(false)}
                  >
                    ✖
                  </button>
                </div>
                <CreateUser
                  onClose={() => {
                    setShowModalCreate(false);
                  }}
                />
              </div>
            </div>
          )}

          <input
            type="text"
            placeholder="Buscar usuário..."
            value={filtroNome}
            onChange={(e) => setFiltroNome(e.target.value)}
            className="border mt-5 bg-white min-w-[500px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none 
            focus:ring-2 focus:ring-blue-500 ml-4"
          />
        </div>
      </div>

      {/* TABELA */}
      <table className="min-w-full border-collapse border-b border-gray-300">
        <thead>
          <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
            <th className="py-2 px-4">Nome</th>
            <th className="py-2 px-4">Email</th>
            <th className="py-2 px-4">Setor</th>
            <th className="py-2 px-4">Cargo</th>
            <th className="py-2 px-4">Nível de Acesso</th>
            <th className="py-2 px-4">Ativo</th>
            <th className="py-2 px-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {usuariosPagina.map((user) => (
            <tr
              key={user.id}
              className="text-center text-md hover:bg-blue-100 transition odd:bg-white even:bg-gray-100 "
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
                    : ""}
              </td>
              <td className="py-2 px-4">{user.active ? "Sim" : "Não"}</td>
              <td className="py-2 px-4">
                <div className="flex justify-center items-center gap-3">
                  {/* Botão Editar */}
                  <button
                    onClick={() => handleEditar(user)}
                    className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-blue-600 hover:bg-blue-500 flex items-center justify-center hover:scale-110 transition duration-200"
                  >
                    <FaRegEdit
                      className="h-6 w-6 text-gray-700 cursor-pointer"
                      title="Editar usuário"
                    />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL ALTERAÇÃO */}
      {showModalAlter && usuarioSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50 transition-opacity duration-300 ease-out">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Alterar Usuário</h2>
              <button
                className="text-red-500 border-2 rounded font-bold text-xl hover:text-red-700 hover:scale-110 bg-red-500 transition duration-200"
                onClick={() => setShowModalAlter(false)}
              >
                ✖
              </button>
            </div>
            <AlterUser user={usuarioSelecionado} />
          </div>
        </div>
      )}

      {/* PAGINAÇÃO */}
      <div className="flex justify-center mt-4 gap-1">
        <button
          onClick={() => setPaginaAtual((prev) => Math.max(prev - 1, 1))}
          className="px-3 py-1 bg-blue-300 rounded hover:bg-blue-400"
        >
          Anterior
        </button>
        <span className="px-3 py-1">
          Página {paginaAtual} de{" "}
          {Math.ceil(usuariosFiltrados.length / registrosPorPagina)}
        </span>
        <button
          onClick={() =>
            setPaginaAtual((prev) =>
              Math.min(
                prev + 1,
                Math.ceil(usuariosFiltrados.length / registrosPorPagina)
              )
            )
          }
          className="px-3 py-1 bg-blue-300 rounded hover:bg-blue-400"
        >
          Próxima
        </button>
      </div>
    </div>
  );
}

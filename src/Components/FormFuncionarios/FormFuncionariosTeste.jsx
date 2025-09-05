import { useEffect, useState } from "react";
import editIcon from "../../assets/editar1.png";
import removIcon from "../../assets/remover1.png";
import HeaderQRCode from "../HeaderQRCode";

export default function TabelaUsuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const registrosPorPagina = 10; // Registros por página
  const indiceUltimoRegistro = paginaAtual * registrosPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - registrosPorPagina;

  if(indiceUltimoRegistro === 0) {
    setPaginaAtual(1)
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
      u.position.toLowerCase().includes(filtroNome.toLowerCase())
  );

  const usuariosPagina = usuariosFiltrados.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  const handleEditar = (id) => {
    alert(`Editar usuário com ID ${id}`);
  };

  const handleExcluir = (id) => {
    setUsuarios(usuarios.filter((u) => u.id !== id));
  };

  return (
    <>
      <div className="p-4">
        {/* Título + Campo de busca */}
        <div className="flex flex-col items-start mb-4">
          <h1 className="text-4xl font-bold">Usuários Cadastrados</h1>
          <div className="justify-between w-full flex mt-4">
            <button className="bg-green-700 text-white px-4 py-2 rounded">
              Novo Usuário
            </button>
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
        <table className=" min-w-full border-collapse items-center justify-center border-b border-gray-300">
          <thead class>
            <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
              <th className="py-2 px-4">Ações</th>
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Setor</th>
              <th className="py-2 px-4">Cargo</th>
              <th className="py-2 px-4">Ativo</th>
            </tr>
          </thead>
          <tbody>
            {usuariosFiltrados.map((user) => (
              <tr
                key={user.id}
                className="text-center hover:bg-blue-300 transition odd:bg-white even:bg-gray-100 "
              >
                <td className="py-2 px-4">
                  <div className="flex justify-center items-center gap-3">
                    {/* Botão Editar */}
                    <button
                      onClick={() => handleEditar(user.id)}
                      className="cursor-pointer p-3 rounded-lg bg-transparent border-1 border-blue-600 hover:bg-blue-500 flex items-center justify-center"
                    >
                      <img
                        src={editIcon}
                        tooltip="Editar usuário"
                        alt="Editar"
                        className="h-6 pointer-events-none"
                      />
                    </button>

                    {/* Botão Remover */}
                    <button
                      onClick={() => handleExcluir(user.id)}
                      className="cursor-pointer p-3 rounded-lg bg-transparent border-1 border-red-600 hover:bg-red-300  flex items-center justify-center"
                    >
                      <img
                        src={removIcon}
                        tooltip="Remover usuário"
                        alt="Remover"
                        className="h-6 pointer-events-none"
                      />
                    </button>
                  </div>
                </td>

                {/* Outras colunas */}
                <td className="py-2 px-4">{user.name}</td>
                <td className="py-2 px-4">{user.email}</td>
                <td className="py-2 px-4">{user.sector}</td>
                <td className="py-2 px-4">{user.position}</td>
                <td className="py-2 px-4">{user.active ? "Sim" : "Não"}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
    </>
  );
}

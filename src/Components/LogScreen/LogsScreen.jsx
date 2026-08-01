import { useEffect, useState } from "react";
import { getLogs } from "../../services/api";
import ModalDetalhesLog from "../ModalDetalhes";

export default function LogsList() {
  const [logs, setLogs] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [acaoSelecionada, setAcaoSelecionada] = useState("Todas");
  const [mostrarDetalhes, setMostrarDetalhes] = useState(false);
  const [logSelecionado, setLogSelecionado] = useState(null);

  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Popup states
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const listarLogs = async () => {
    const resposta = await getLogs();
    if (resposta.success) {
      setLogs(resposta.data);
    } else {
      setLogs([]);
    }
  };

  useEffect(() => {
    listarLogs();
  }, []);

  const showTemporaryPopup = (message, sucesso = true) => {
    setPopupMessage(message);
    setIsSuccess(sucesso);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const logsFiltrados = logs.filter((l) => {
    const texto = filtro.toLowerCase();

    const passaTexto =
      l.name?.toLowerCase().includes(texto) ||
      l.action?.toLowerCase().includes(texto) ||
      l.newData?.emplName?.toLowerCase().includes(texto) ||
      l.newData?.name?.toLowerCase().includes(texto);

    const passaAcao =
      acaoSelecionada === "Todas" || l.action === acaoSelecionada;

    return passaTexto && passaAcao;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(logsFiltrados.length / regPorPagina),
  );
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = logsFiltrados.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro,
  );

  const getBadgeClass = (acao) => {
    switch (acao) {
      case "Criação de Usuário":
        return "bg-green-100 text-green-700";

      case "Alteração de usuário":
        return "bg-yellow-100 text-yellow-700";

      case "Alteração de Funcionário":
        return "bg-indigo-100 text-indigo-700";

      case "Retirada de Kit":
        return "bg-blue-100 text-blue-700";

      case "Devolução de Kit":
        return "bg-orange-100 text-orange-700";

      case "Baixa de Pendência":
        return "bg-purple-100 text-purple-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="p-6 mt-10 mr-50">
      <div className="flex flex-col item-start mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Logs do Sistema
        </h1>
        <p className="text-gray-600 text-sm mt-1">
          Visualize as ações realizadas pelos usuários no sistema
        </p>
      </div>
      {/* Filtros */}
      <div className="bg-white shadow-md rounded-lg p-5 mb-6 flex flex-wrap justify-between items-center gap-6">
        <div className="flex gap-4 flex-wrap">
          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Registros por página
            </label>
            <select
              value={regPorPagina}
              onChange={(e) => {
                setRegPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              {[10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-600 mb-1">
              Ações
            </label>
            <select
              value={acaoSelecionada}
              onChange={(e) => {
                setAcaoSelecionada(e.target.value);
                setPaginaAtual(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value="Todas">Todas as ações</option>
              <option value="Criação de Usuário">Criação de Usuário</option>
              <option value="Alteração de usuário">Alteração de Usuário</option>
              <option value="Alteração de Funcionário">
                Alteração de Funcionário
              </option>
              <option value="Baixa de Pendência">Baixa de Pendência</option>
              <option value="Retirada de Kit">Retirada de Kit</option>
              <option value="Devolução de Kit">Devolução de Kit</option>
            </select>
          </div>
        </div>

        <div className="w-[30vw]">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Filtrar por usuário ou Ação"
            value={filtro}
            onChange={(e) => {
              (setFiltro(e.target.value), setPaginaAtual(1));
            }}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabela */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-md font-semibold">
              <th className="px-5 py-3 text-left">DATA/HORA</th>
              <th className="py-3 text-left">USUÁRIO</th>
              <th className="py-3 ">AÇÃO</th>
              <th className="py-3 px-4 ">DETALHES</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((p, i) => (
              <tr
                key={p.id}
                className={`text-center text-sm ${
                  i % 2 === 0 ? "bg-white" : "bg-gray-50"
                } hover:bg-blue-50 transition`}
              >
                <td className="px-5 py-2 text-left">
                  {new Date(p.createdAt).toLocaleString("pt-BR")}
                </td>
                <td className="px-2 py-2 text-left">{p.name}</td>
                <td className="py-2">
                  <span
                    className={`px-3 py-1 rounded-full text-md font-semibold ${getBadgeClass(p.action)}`}
                  >
                    {p.action}
                  </span>
                </td>
                <td className="py-2">
                  <button
                    onClick={() => {
                      setLogSelecionado(p);
                      setMostrarDetalhes(true);
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700 transition"
                  >
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center mt-6 gap-4 items-center">
        <button
          onClick={() => setPaginaAtual(1)}
          disabled={paginaAtual === 1}
          className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Primeira Página
        </button>
        <button
          onClick={() => paginaAtual > 1 && setPaginaAtual(paginaAtual - 1)}
          disabled={paginaAtual === 1}
          className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Anterior
        </button>
        <span className="text-gray-700 text-sm">
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() =>
            paginaAtual < totalPaginas && setPaginaAtual(paginaAtual + 1)
          }
          disabled={paginaAtual === totalPaginas}
          className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Próxima
        </button>
        <button
          onClick={() => setPaginaAtual(totalPaginas)}
          disabled={paginaAtual === totalPaginas || totalPaginas === 0}
          className="px-4 py-1 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          Última Página
        </button>
      </div>
      <ModalDetalhesLog
        mostrar={mostrarDetalhes}
        log={logSelecionado}
        onClose={() => {
          setMostrarDetalhes(false);

          setLogSelecionado(null);
        }}
      />
    </div>
  );
}

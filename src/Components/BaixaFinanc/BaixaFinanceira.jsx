import { useEffect, useState } from "react";
import { carregarPendencias } from "../../services/api";
import ModalSimNao from "../ModalSimNao";
import axios from "axios";

export default function ListaPendencias() {
  const [pendencias, setPendencias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [selecionados, setSelecionados] = useState({});

  // Estados para popup de mensagens
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const API_URL = "http://localhost:3000";

  // Cancelar operação do modal
  const cancelarOperacao = () => {
    setMostarModalSimNao(false);
  };

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

  // Função para mostrar popup temporário
  const showTemporaryPopup = (message, sucesso = true) => {
    setPopupMessage(message);
    setIsSuccess(sucesso);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // Função Baixar (alterar status para 2)
  const baixarPendencias = async () => {
    const idsSelecionados = Object.keys(selecionados).filter(
      (id) => selecionados[id]
    );

    if (idsSelecionados.length === 0) {
      showTemporaryPopup("Nenhuma pendência selecionada.", false);
      setMostarModalSimNao(false);
      return;
    }

    try {
      const resposta = await axios.put(
        `${API_URL}/pend/baixar`,
        { ids: idsSelecionados },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (resposta.data.success) {
        setPendencias((prev) =>
          prev.map((p) =>
            idsSelecionados.includes(p.id.toString()) ? { ...p, status: 2 } : p
          )
        );
        setSelecionados({});
        setMostarModalSimNao(false);
        showTemporaryPopup("Pendências baixadas com sucesso!", true);
      } else {
        showTemporaryPopup(
          resposta.data.message || "Erro ao baixar pendências.",
          false
        );
        setMostarModalSimNao(false);
      }
    } catch (err) {
      console.error("Erro ao baixar pendências:", err);
      showTemporaryPopup("Erro ao baixar pendências.", false);
      setMostarModalSimNao(false);
    }
  };

  // Filtro por nome ou usuário
  const pendenciasFiltradas = pendencias.filter(
    (p) =>
      p.emplName?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.userName?.toLowerCase().includes(filtro.toLowerCase())
  );

  // Paginação
  const totalPaginas = Math.ceil(pendenciasFiltradas.length / regPorPagina);
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = pendenciasFiltradas.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) setPaginaAtual((prev) => prev + 1);
  };

  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) setPaginaAtual((prev) => prev - 1);
  };

  return (
    <div className="p-4 ">
      <div className="flex justify-between">
        <label className="font-bold text-4xl mb-3">Baixa Financeira</label>
      </div>

      {/* Seleção de registros por página */}
      <div className="mb-4 flex items-center gap-3 w-full justify-between">
        <div className="mb-4 flex items-center gap-3">
          <label>Registros por página:</label>
          <select
            value={regPorPagina}
            onChange={(e) => {
              setRegPorPagina(Number(e.target.value));
              setPaginaAtual(1); // resetar página
            }}
            className="border rounded p-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <input
          type="text"
          placeholder="Filtrar por nome ou usuário"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="mb-4 p-2 border rounded w-[30vw]"
        />
      </div>
      {/* Popup de mensagens */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={
              isSuccess
                ? "bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut"
                : "bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut"
            }
          >
            {popupMessage}
          </div>
        </div>
      )}

      {/* Tabela de pendências */}
      <table className="min-w-full border-collapse border-b border-gray-300">
        <thead>
          <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
            <th className="py-2 px-4">Funcionário</th>
            <th className="py-2 px-4">Usuário</th>
            <th className="py-2 px-1">Data</th>
            <th className="py-2 px-1">Alterado Por</th>
            <th className="py-2 px-1">Data Devolução</th>
            <th className="py-2 px-1">Tamanho Kit</th>
            <th className="py-2 px-1">Baixa Financeira</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.map((p) => {
            const estaSelecionado = !!selecionados[p.id];
            const fundoLinha =
              p.status === 2
                ? "bg-red-100"
                : estaSelecionado
                  ? "bg-blue-200"
                  : "";

            return (
              <tr
                key={p.id}
                className={`text-center text-md transition cursor-pointer 
                 ${p.status === 2 ? "bg-blue-400" : "odd:bg-white even:bg-gray-100 hover:bg-blue-700"}
                `}
                onClick={() => p.status !== 2 && toggleSelecionado(p.id)}
              >
                <td className="py-2 px-4">{p.emplName}</td>
                <td className="py-2 px-4">{p.userName}</td>
                <td className="py-2 px-1">
                  {new Date(p.date).toLocaleString("pt-BR")}
                </td>
                <td className="py-2 px-1">{p.devolUserName}</td>
                <td className="py-2 px-1">
                  {p.devolDate
                    ? new Date(p.devolDate).toLocaleString("pt-BR")
                    : ""}
                </td>
                <td className="py-2 px-1">{p.kitSize}</td>
                <td className="py-2 px-1">
                  <input
                    type="checkbox"
                    checked={estaSelecionado || p.status === 2}
                    readOnly
                    disabled={p.status !== 1}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* PAGINAÇÃO e botão Baixar */}
      <div className="flex justify-between mt-4 items-center">
        <div className="flex gap-2 ml-[35vw] items-center">
          <button
            onClick={handlePaginaAnterior}
            disabled={paginaAtual === 1}
            className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="ml-1">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            onClick={handleProximaPagina}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="px-4 py-1 bg-gray-300 rounded hover:bg-gray-400 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>

        <button
          onClick={() => setMostarModalSimNao(true)}
          className="px-8 py-1 bg-blue-500 rounded hover:bg-blue-400 "
        >
          Baixar
        </button>

        <ModalSimNao
          mostrar={MostrarModalSimNao}
          onConfirmar={baixarPendencias}
          onCancelar={cancelarOperacao}
          onClose ={listarPendencias}
        />
      </div>

      <style jsx>{`
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          90% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .animate-fadeInOut {
          animation: fadeInOut 3s forwards;
        }
      `}</style>
    </div>
  );
}

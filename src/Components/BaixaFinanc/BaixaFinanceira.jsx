import { useEffect, useState } from "react";
import { carregarPendencias } from "../../services/api";
import ModalSimNao from "../ModalSimNao";
import axios from "axios";
import redLight from "../../assets/red-light.png";
import greenLight from "../../assets/green-light.png";

export default function ListaPendencias() {
  const [pendencias, setPendencias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [MostrarModalSimNao, setMostrarModalSimNao] = useState(false);
  const [filtroPorBaixa, setFiltroPorBaixa] = useState(1);
  const [idSelecionado, setIdSelecionado] = useState(null);

  // Estados para popup de mensagens
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const API_URL = "http://localhost:3000";

  const cancelarOperacao = () => {
    setMostrarModalSimNao(false);
  };

  const listarPendencias = async () => {
    const dados = await carregarPendencias();
    if (dados?.success) {
      setPendencias(dados.data);
    }
  };

  useEffect(() => {
    listarPendencias();
  }, []);

  // const handleSelecionarLinha = (id, status) => {
  //   if (status === 2) return; // não seleciona baixadas
  //   setIdSelecionado(id === idSelecionado ? null : id);
  // };

  const showTemporaryPopup = (message, sucesso = true) => {
    setPopupMessage(message);
    setIsSuccess(sucesso);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // Função para baixar uma pendência específica

  const baixarPendencias = async (id) => {
    try {
      const resposta = await axios.put(
        `${API_URL}/pend/baixar`,
        { id },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      if (resposta.data.success) {
        const pendenciaAtualizada = resposta.data.updatedPendencias[0];

        // Atualiza a tabela
        setPendencias((prev) =>
          prev.map((p) =>
            p.id === pendenciaAtualizada.id
              ? { ...p, ...pendenciaAtualizada }
              : p
          )
        );

        // Mensagem de sucesso
        showTemporaryPopup(
          `Pendência do funcionário ${pendenciaAtualizada.emplName} baixada em ${new Date(
            pendenciaAtualizada.devolDate
          ).toLocaleString("pt-BR")} por ${pendenciaAtualizada.devolUserName}`,
          true
        );

        setMostrarModalSimNao(false);
      } else {
        showTemporaryPopup(
          resposta.data.message || "Erro ao baixar pendência.",
          false
        );
        setMostrarModalSimNao(false);
      }
    } catch (err) {
      console.error("Erro ao baixar pendência:", err);
      showTemporaryPopup("Erro ao baixar pendência.", false);
      setMostrarModalSimNao(false);
    }
  };

  // Filtragem
  const pendenciasFiltradas = pendencias.filter((p) => {
    const passaFiltroTexto =
      p.emplName?.toLowerCase().includes(filtro.toLowerCase()) ||
      p.userName?.toLowerCase().includes(filtro.toLowerCase());

    const passaFiltroStatus =
      filtroPorBaixa === 0 || p.status === filtroPorBaixa;
    return passaFiltroTexto && passaFiltroStatus;
  });

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
    <div className="p-4">
      <div className="flex justify-between">
        <label className="font-bold text-4xl mb-3">Baixa Financeira</label>
      </div>

      <div className="mb-4 flex items-center gap-3 w-full justify-between mt-5">
        <div className="mb-4 flex items-center gap-3">
          <label>Registros por página:</label>
          <select
            value={regPorPagina}
            onChange={(e) => {
              setRegPorPagina(Number(e.target.value));
              setPaginaAtual(1);
            }}
            className="border rounded p-1"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>

          <label className="ml-30">Apresentar pendências:</label>
          <select
            value={filtroPorBaixa}
            onChange={(e) => {
              setFiltroPorBaixa(Number(e.target.value));
              setPaginaAtual(1);
            }}
            className="border rounded p-1"
          >
            <option value={1}>Em Aberto</option>
            <option value={2}>Baixadas</option>
            <option value={0}>Todas</option>
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

      <table className="min-w-full border-collapse border-b border-gray-300">
        <thead>
          <tr className="text-center bg-gray-100 border-t border-gray-300 text-xl font-bold">
            <th className="py-2 px-4"></th>
            <th className="py-2 px-4">Funcionário</th>
            <th className="py-2 px-1">Data</th>
            <th className="py-2 px-1">Data Devolução</th>
            <th className="py-2 px-1">Tamanho Kit</th>
            <th className="py-2 px-1">Baixa Financeira</th>
          </tr>
        </thead>
        <tbody>
          {registrosFiltrados.map((p) => (
            <tr
              key={p.id}
              className={`text-center text-md transition cursor-pointer hover:bg-blue-200 ${
                p.status === 2 ? "text-gray-500" : ""
              }`}
              // onClick={() => handleSelecionarLinha(p.id, p.status)}
            >
              <td className="py-2 px-4">
                {p.status === 1 ? (
                  <img
                    src={redLight}
                    alt="Em aberto"
                    className="w-6 h-6 inline"
                  />
                ) : (
                  <img
                    src={greenLight}
                    alt="Baixado"
                    className="w-6 h-6 inline"
                  />
                )}
              </td>
              <td className="py-2 px-4">{p.emplName}</td>
              <td className="py-2 px-1">
                {new Date(p.date).toLocaleString("pt-BR")}
              </td>
              <td className="py-2 px-1">
                {p.devolDate
                  ? new Date(p.devolDate).toLocaleString("pt-BR")
                  : ""}
              </td>
              <td className="py-2 px-1">{p.kitSize}</td>
              <td className="py-2 px-1">
                {p.status === 1 ? (
                  <button
                    onClick={() => {
                      (setIdSelecionado(p.id), setMostrarModalSimNao(true));
                    }}
                    className="px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-400"
                  >
                    Baixar
                  </button>
                ) : (
                  <span>
                    <button
                      className="px-2 py-1 bg-gray-500 text-white rounded"
                      disabled
                    >
                      Baixado
                    </button>
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

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

        <ModalSimNao
          mostrar={MostrarModalSimNao}
          onConfirmar={() => baixarPendencias(idSelecionado)}
          onCancelar={cancelarOperacao}
          onClose={() => {
            listarPendencias();
            setMostrarModalSimNao(false);
          }}
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

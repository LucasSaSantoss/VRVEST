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
  const [isProcessing, setIsProcessing] = useState(false);
  const [mensagem, setMensagem] = useState("");

  // Popup states
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL;

  const cancelarOperacao = () => setMostrarModalSimNao(false);

  const listarPendencias = async () => {
    const dados = await carregarPendencias();
    if (dados?.success) setPendencias(dados.data);
  };

  useEffect(() => {
    listarPendencias();
  }, []);

  const showTemporaryPopup = (message, sucesso = true) => {
    setPopupMessage(message);
    setIsSuccess(sucesso);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  const baixarPendencias = async (id) => {
    setIsProcessing(true);
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
        setPendencias((prev) =>
          prev.map((p) =>
            p.id === pendenciaAtualizada.id
              ? { ...p, ...pendenciaAtualizada }
              : p
          )
        );
        showTemporaryPopup(
          `Pendência de ${pendenciaAtualizada.emplName} baixada com sucesso.`,
          true
        );
      } else {
        showTemporaryPopup(
          resposta.data.message || "Erro ao baixar pendência.",
          false
        );
      }
    } catch {
      showTemporaryPopup("Erro ao baixar pendência.", false);
    } finally {
      setIsProcessing(false);
      setMostrarModalSimNao(false);
    }
  };

  const pendenciasFiltradas = pendencias.filter((p) => {
    const texto = filtro.toLowerCase();
    const passaTexto =
      p.emplName?.toLowerCase().includes(texto) ||
      p.userName?.toLowerCase().includes(texto) ||
      p.employee?.cpf.toLowerCase().includes(texto);
    const passaStatus = filtroPorBaixa === 0 || p.status === filtroPorBaixa;
    return passaTexto && passaStatus;
  });

  const totalPaginas = Math.max(
    1,
    Math.ceil(pendenciasFiltradas.length / regPorPagina)
  );
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = pendenciasFiltradas.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  return (
    <div className="p-6 mt-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Baixa Financeira</h1>
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
              Status
            </label>
            <select
              value={filtroPorBaixa}
              onChange={(e) => {
                setFiltroPorBaixa(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="border border-gray-300 rounded-lg px-3 py-1 focus:ring-2 focus:ring-blue-400 focus:outline-none"
            >
              <option value={1}>Em Aberto</option>
              <option value={2}>Baixadas</option>
              <option value={0}>Todas</option>
            </select>
          </div>
        </div>

        <div className="w-[30vw]">
          <label className="block text-sm font-semibold text-gray-600 mb-1">
            Buscar
          </label>
          <input
            type="text"
            placeholder="Filtrar por nome, usuário ou CPF"
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-400 focus:outline-none"
          />
        </div>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white transition-all duration-500 ${
              isSuccess ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {popupMessage}
          </div>
        </div>
      )}

      {/* Tabela */}
      <div className="overflow-x-auto bg-white shadow-md rounded-lg">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-gray-700 text-md font-semibold">
              <th className="py-3 px-4"></th>
              <th className="py-3 px-4 text-left">Colaborador</th>
              <th className="py-3 px-4">CPF</th>
              <th className="py-3 px-4">Data</th>
              <th className="py-3 px-4">Data Devolução</th>
              <th className="py-3 px-4">Baixa Realizada Por</th>
              <th className="py-3 px-4">Tamanho Kit</th>
              <th className="py-3 px-4 text-center">Baixa Financeira</th>
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
                <td className="py-2">
                  <img
                    src={p.status === 1 ? redLight : greenLight}
                    alt={p.status === 1 ? "Em aberto" : "Baixado"}
                    className="w-5 h-5 mx-auto"
                  />
                </td>
                <td className="py-2 text-left">{p.emplName}</td>
                <td className="py-2">{p.employee?.cpf}</td>
                <td className="py-2">
                  {new Date((new Date(p.date).getTime() + 3 * 60 * 60 * 1000)).toLocaleString("pt-BR")}
                </td>
                <td className="py-2">
                  {p.devolDate
                    ? new Date((new Date(p.devolDate).getTime() + 3 * 60 * 60 * 1000)).toLocaleString("pt-BR")
                    : "-"}
                </td>
                <td className="py-2">{p.devolUserName || "-"}</td>
                <td className="py-2">{p.kitSize}</td>
                <td className="py-2">
                  {p.status === 1 ? (
                    <button
                      onClick={() => {
                        setIdSelecionado(p.id);
                        setMensagem(
                          `Deseja baixar a pendência do funcionário ${p.emplName}?`
                        );
                        setMostrarModalSimNao(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-1 rounded-lg hover:bg-blue-700 transition"
                    >
                      Baixar
                    </button>
                  ) : (
                    <span className="bg-gray-400 text-white px-3 py-1 rounded-lg text-sm">
                      Baixado
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center mt-6 gap-4 items-center">
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
      </div>

      {/* Modal */}
      <ModalSimNao
        mostrar={MostrarModalSimNao}
        onConfirmar={() => baixarPendencias(idSelecionado)}
        onCancelar={cancelarOperacao}
        onClose={() => {
          listarPendencias();
          setMostrarModalSimNao(false);
        }}
        isProcessing={isProcessing}
        mensagem={mensagem}
      />
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import carregarFuncionarios from "../../services/api";
import CreateFunc from "./CreateFunc";
import AlterForm from "./AlterFuncionarios";
import ImportarColab from "./ImportFunc";
import ImpressaoCracha from "../ImpCracha/ImpressaoCracha";
import { useReactToPrint } from "react-to-print";
import { LuQrCode } from "react-icons/lu";
import { FaRegEdit } from "react-icons/fa";

export default function ListaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);

  // Modais
  const [showCreateFunc, setshowCreateFunc] = useState(false);
  const [MostrarAlterFunc, setMostarAlterFunc] = useState(false);
  const [showModalCracha, setShowModalCracha] = useState(false);
  const [funcSelecionado, setFuncSelecionado] = useState(null);
  const [showImportFunc, setShowImportFunc] = useState(false);

  // Popup de feedback
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  const mostrarPopup = (mensagem, tipo = "info") => {
    setPopup({ mostrar: true, mensagem, tipo });
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 2000);
  };

  // Impressão
  const contentRef = useRef(null);
  const ReactToPrintFn = useReactToPrint({
    contentRef,
    documentTitle: "Crachá Funcionário",
  });

  // Carregar lista
  const listarFuncionarios = async () => {
    const dados = await carregarFuncionarios();
    setFuncionarios(dados);
  };

  useEffect(() => {
    listarFuncionarios();
  }, []);

  // Filtrar
  const funcionariosFiltrados = funcionarios.filter(
    (u) =>
      u.name.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.sector.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.position.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.cpf.toLowerCase().includes(filtroNome.toLowerCase())
  );

  // Paginação
  const totalPaginas = Math.ceil(funcionariosFiltrados.length / regPorPagina);
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = funcionariosFiltrados.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  const handleProximaPagina = () => {
    if (paginaAtual < totalPaginas) setPaginaAtual((prev) => prev + 1);
  };
  const handlePaginaAnterior = () => {
    if (paginaAtual > 1) setPaginaAtual((prev) => prev - 1);
  };

  const abrirAlterForm = (func) => {
    setFuncSelecionado(func);
    setMostarAlterFunc(true);
  };

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-10 mt-20">
        <div className="flex flex-col items-start mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Colaboradores Cadastrados
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Gerencie os colaboradores cadastrados no sistema
          </p>
          {/* Barra de ação */}
          <div className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between mt-6 gap-4">
            <button
              className="bg-[#27ae60] text-white px-4 py-2 rounded hover:bg-green-800 transition w-full lg:w-auto"
              onClick={() => setshowCreateFunc(true)}
            >
              + Novo Colaborador
            </button>

            <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
              <button
                className="bg-[#27ae60] text-white px-4 py-2 rounded hover:bg-green-800 transition w-full lg:w-auto"
                onClick={() => setShowImportFunc(true)}
              >
                Importar Colaboradores
              </button>

              <input
                type="text"
                placeholder="Buscar Funcionário..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="border bg-white w-full sm:w-[300px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />

              <div className="flex items-center">
                <label className="mr-3 text-sm sm:text-base">Registros:</label>
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
              </div>
            </div>
          </div>
        </div>

        {/* Tabela responsiva */}
        <div className="overflow-x-auto shadow-md rounded-lg mt-4">
          <table className="min-w-full border-collapse border-b border-gray-200 text-sm sm:text-base">
            <thead>
              <tr className="text-center bg-gray-100 border-t border-gray-300 font-bold">
                <th className="py-3 px-2 sm:px-4">Nome</th>
                <th className="py-3 px-2 sm:px-4">Email</th>
                <th className="py-3 px-2 sm:px-4">CPF</th>
                <th className="py-3 px-2 sm:px-4">Setor</th>
                <th className="py-3 px-2 sm:px-4">Cargo</th>
                <th className="py-3 px-2 sm:px-4">Ativo</th>
                <th className="py-3 px-2 sm:px-4">Temporário</th>
                <th className="py-3 px-2 sm:px-4">Ações</th>
              </tr>
            </thead>
            <tbody>
              {registrosFiltrados.map((employee) => (
                <tr
                  key={employee.id}
                  className="text-center text-gray-700 hover:bg-gray-300 transition odd:bg-white even:bg-gray-50"
                >
                  <td className="py-2 px-2 sm:px-4 truncate max-w-[180px]">
                    {employee.name}
                  </td>
                  <td className="py-2 px-2 sm:px-4 truncate max-w-[200px]">
                    {employee.email}
                  </td>
                  <td className="py-2 px-2 sm:px-4">{employee.cpf}</td>
                  <td className="py-2 px-2 sm:px-4">{employee.sector}</td>
                  <td className="py-2 px-2 sm:px-4">{employee.position}</td>
                  <td className="py-2 px-2 sm:px-4">
                    {employee.active === 1 ? "Sim" : "Não"}
                  </td>
                  <td
                    className={`py-2 px-2 sm:px-4 ${
                      employee.tempEmpl === 1 ? "text-red-600" : "text-blue-600"
                    }`}
                  >
                    {employee.tempEmpl === 1 ? "Sim" : "Não"}
                  </td>
                  <td className="py-2 px-2 sm:px-4">
                    <div className="flex justify-center items-center gap-3">
                      {/* Editar */}
                      <button
                        onClick={() => abrirAlterForm(employee)}
                        className="p-2 border border-cyan-600 rounded-lg hover:bg-cyan-600 hover:text-white transition"
                      >
                        <FaRegEdit />
                      </button>

                      {/* QR Code */}
                      <button
                        onClick={() => {
                          setShowModalCracha(true);
                          setFuncSelecionado(employee);
                        }}
                        className="cursor-pointer p-1 rounded-lg bg-transparent border border-[#27ae60] hover:bg-[#27ae60] hover:scale-110 transition duration-200"
                      >
                        <LuQrCode
                          className="h-5 w-6 text-t-700"
                          title="Gerar QR Code"
                        />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6">
          <button
            onClick={handlePaginaAnterior}
            disabled={paginaAtual === 1}
            className="px-4 py-2 bg-[#36b0d4] rounded text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition"
          >
            Anterior
          </button>
          <span className="text-sm sm:text-base">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            onClick={handleProximaPagina}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="px-4 py-2 bg-[#36b0d4] rounded text-white font-medium hover:bg-blue-500 disabled:opacity-50 transition"
          >
            Próxima
          </button>
        </div>
      </div>

      {/* Popup */}
      {popup.mostrar && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-opacity ${
            popup.tipo === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {popup.mensagem}
        </div>
      )}

      {/* Modal Criação */}
      {showCreateFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[70vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Cadastro de Colaborador
              </h2>
              <button
                onClick={() => setshowCreateFunc(false)}
                className="text-red-500 font-bold text-xl hover:scale-110 transition"
              >
                ✖
              </button>
            </div>
            <CreateFunc
              onClose={() => {
                listarFuncionarios();
                mostrarPopup("Funcionário criado com sucesso.", "success");
              }}
            />
          </div>
        </div>
      )}

      {/* Modal Edição */}
      {MostrarAlterFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[70vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Alteração de Colaboradores
              </h2>
              <button
                onClick={() => setMostarAlterFunc(false)}
                className="text-red-500 font-bold text-xl hover:scale-110 transition"
              >
                ✖
              </button>
            </div>
            <AlterForm
              employee={funcSelecionado}
              onUpdate={listarFuncionarios}
              onClose={() => {
                setMostarAlterFunc(false);
                setFuncSelecionado(null);
              }}
              mostrarPopup={mostrarPopup}
            />
          </div>
        </div>
      )}

      {/* Modal Edição */}
      {showImportFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[90vw] md:w-[70vw] lg:w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl sm:text-2xl font-bold">
                Alteração de Colaboradores
              </h2>
              <button
                onClick={() => setShowImportFunc(false)}
                className="text-red-500 font-bold text-xl hover:scale-110 transition"
              >
                ✖
              </button>
            </div>
            <ImportarColab />
          </div>
        </div>
      )}

      {/* Modal Impressão de Crachá */}
      {showModalCracha && funcSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[rgb(23,110,150)] p-3 rounded-lg shadow-lg w-[90vw] sm:w-[350px] max-h-[100vh] overflow-y-auto text-center border-2 border-gray-200">
            <div className="flex justify-end items-center">
              <button
                className="text-red-500 font-bold text-xl hover:scale-110 transition"
                onClick={() => setShowModalCracha(false)}
              >
                ✖
              </button>
            </div>
            <div ref={contentRef}>
              <ImpressaoCracha
                cpf={funcSelecionado.cpf}
                nome={funcSelecionado.name}
              />
            </div>
            <button
              className="bg-green-500 text-white rounded-xl w-40 h-12 font-bold hover:text-green-700 hover:scale-110 transition mt-4 mb-4"
              onClick={() => {
                ReactToPrintFn();
                setShowModalCracha(false);
              }}
            >
              Imprimir
            </button>
          </div>
        </div>
      )}
    </>
  );
}

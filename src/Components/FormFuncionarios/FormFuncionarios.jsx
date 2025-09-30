import { useEffect, useState, useRef } from "react";
import carregarFuncionarios from "../../services/api";
import CreateFunc from "./CreateFunc";
import AlterForm from "./AlterFuncionarios";
import ImpressaoCracha from "../ImpCracha/ImpressaoCracha";
import { useReactToPrint } from "react-to-print";
import { LuQrCode } from "react-icons/lu";
import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

export default function ListaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [showPopup, setShowPopup] = useState(false);

  // Modais
  const [showCreateFunc, setshowCreateFunc] = useState(false); // Criação
  const [MostrarAlterFunc, setMostarAlterFunc] = useState(false); // Edição
  const [showModalCracha, setShowModalCracha] = useState(false); // QR Code
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [funcSelecionado, setFuncSelecionado] = useState(null);

  //------------------ popup criação/alteração --------------------
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info", // success / error / info
  });
  const mostrarPopup = (mensagem, tipo = "info") => {
    setPopup({ mostrar: true, mensagem, tipo });
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
  };

  // ---------------------------------------------------------------

  // Impressão
  const contentRef = useRef(null);
  const ReactToPrintFn = useReactToPrint({
    contentRef, // passa o ref direto
    documentTitle: "Crachá Funcionário",
  });

  // Listar funcionários
  const listarFuncionarios = async () => {
    const dados = await carregarFuncionarios();
    setFuncionarios(dados);
  };

  useEffect(() => {
    listarFuncionarios();
  }, []);

  const funcionariosFiltrados = funcionarios.filter(
    (u) =>
      u.name.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.sector.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.position.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.cpf.toLowerCase().includes(filtroNome.toLowerCase())
  );

  // Abrir edição
  const abrirAlterForm = (func) => {
    setFuncSelecionado(func);
    setMostarAlterFunc(true);
  };

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

  return (
    <>
      <div className="p-4">
        <div className="flex flex-col items-start mb-4">
          <h1 className="text-4xl font-bold">Colaboradores Cadastrados</h1>

          {/* Barra de ação */}
          <div className="w-full flex items-center justify-between mt-8">
            {/* Novo funcionário */}
            <button
              className="bg-[#27ae60] text-white px-4 py-2 rounded hover:bg-green-800 transition"
              onClick={() => setshowCreateFunc(true)}
            >
              Novo Colaborador
            </button>

            {/* Busca + paginação */}
            <div className="flex items-center gap-6">
              {/* Busca */}
              <input
                type="text"
                placeholder="Buscar Funcionário..."
                value={filtroNome}
                onChange={(e) => setFiltroNome(e.target.value)}
                className="border bg-white min-w-[300px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Registros por página */}
              <div className="flex items-center">
                <label className="mr-3">Registros por página:</label>
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

        {/* Tabela */}
        <table className="min-w-full border-collapse border-b border-gray-300">
          <thead>
            <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">CPF</th>
              <th className="py-2 px-4">Setor</th>
              <th className="py-2 px-4">Cargo</th>
              <th className="py-2 px-4">Ativo</th>
              <th className="py-2 px-4">Temporário</th>
              <th className="py-2 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {registrosFiltrados.map((employee) => (
              <tr
                key={employee.id}
                className="text-center text-md hover:bg-blue-100 transition odd:bg-white even:bg-gray-100"
              >
                <td className="py-2 px-4">{employee.name}</td>
                <td className="py-2 px-4">{employee.email}</td>
                <td className="py-2 px-4">{employee.cpf}</td>
                <td className="py-2 px-4">{employee.sector}</td>
                <td className="py-2 px-4">{employee.position}</td>
                <td className="py-2 px-4">
                  {employee.active === 1 ? "Sim" : "Não"}
                </td>
                <td
                  className={`py-2 px-4 ${employee.tempEmpl === 1 ? "text-red-600" : "text-blue-600"}`}
                >
                  {employee.tempEmpl === 1 ? "Sim" : "Não"}
                </td>
                <td className="py-2 px-4">
                  <div className="flex justify-center items-center gap-3">
                    {/* Editar */}
                    <button
                      onClick={() => abrirAlterForm(employee)}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-[#1d8aaa] hover:bg-[#1d8aaa] flex items-center justify-center hover:scale-110 transition duration-200"
                    >
                      <FaRegEdit
                        className="h-6 w-6 text-gray-700"
                        title="Editar usuário"
                      />
                    </button>

                    {/* QR Code */}
                    <button
                      onClick={() => {
                        setShowModalCracha(true);
                        setFuncSelecionado(employee);
                      }}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-[#27ae60] hover:bg-[#27ae60] hover:scale-110 transition duration-200"
                    >
                      <LuQrCode
                        className="h-6 w-6 text-gray-700"
                        title="Gera QR Code"
                      />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Criação */}
      {showCreateFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Cadastro de Colaborador</h2>
              <button
                onClick={() => setshowCreateFunc(false)}
                className="text-red-500 font-bold text-xl hover:bg-red-700 hover:scale-110 transition duration-200 ease-in-out "
              >
                ✖
              </button>
            </div>
            <CreateFunc
              onClose={() => {
                // setshowCreateFunc(false);
                listarFuncionarios();
                setShowPopup("Funcionário criado com sucesso.");
              }}
            />
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {MostrarAlterFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold">Alteração de Colaboradores</h2>
            <div className="flex justify-end items-center mb-4 ">
              <button
                className="text-red-500 font-bold text-xl hover:bg-red-700 hover:scale-110 duration-300 ease-in-out"
                onClick={() => setMostarAlterFunc(false)}
              >
                ✖
              </button>
            </div>
            <AlterForm
              employee={funcSelecionado}
              onUpdate={listarFuncionarios} // recarrega lista
              onClose={() => {
                // fecha modal
                setMostarAlterFunc(false);
                setFuncSelecionado(null);
              }}
              mostrarPopup={mostrarPopup}
            />
          </div>
        </div>
      )}

      {popup.mostrar && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-opacity
      ${popup.tipo === "success" ? "bg-green-500" : "bg-red-500"}`}
        >
          {popup.mensagem}
        </div>
      )}

      {/* Modal de Impressão de Crachá */}
      {showModalCracha && funcSelecionado && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm ">
          <div className="bg-[rgb(23,110,150)] p-6 rounded-lg shadow-lg w-[35vw] max-h-[100vh] overflow-y-auto text-center border-2 border-gray-200">
            <div className="flex justify-end items-center ">
              <button
                className="text-red-500 font-bold text-xl hover:scale-110 transition duration-200 "
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
              className="bg-green-500 text-white rounded-xl w-40 h-13 font-bold hover:text-green-700 hover:scale-110 transition duration-200 mt-4"
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

      {/* PAGINAÇÃO */}
      <div className="flex justify-between mt-4 items-center">
        <div className="flex gap-2 ml-[35vw] items-center">
          <button
            onClick={handlePaginaAnterior}
            disabled={paginaAtual === 1}
            className="px-4 py-1 bg-[#36b0d4] rounded hover:bg-blue-500 disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="ml-1">
            Página {paginaAtual} de {totalPaginas}
          </span>
          <button
            onClick={handleProximaPagina}
            disabled={paginaAtual === totalPaginas || totalPaginas === 0}
            className="px-4 py-1 bg-[#36b0d4] rounded hover:bg-blue-500 disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      </div>
    </>
  );
}

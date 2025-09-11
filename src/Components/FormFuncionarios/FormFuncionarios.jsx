import { useEffect, useState, useRef } from "react";
import carregarFuncionarios from "../../services/api";
import FormFunc from "./FormFunc";
import AlterForm from "./AlterFuncionarios";
import ImpressaoCracha from "../ImpCracha/ImpressaoCracha";
import { useReactToPrint } from "react-to-print";
import { LuQrCode } from "react-icons/lu";
import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

export default function ListaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");

  // Modais
  const [showFormFunc, setShowFormFunc] = useState(false); // Criação
  const [MostrarAlterFunc, setMostarAlterFunc] = useState(false); // Edição
  const [showModalCracha, setShowModalCracha] = useState(false); // QR Code

  const [funcSelecionado, setFuncSelecionado] = useState(null);

  // Impressão
  const contentRef = useRef(null);
  const ReactToPrintFn = useReactToPrint({ content: () => contentRef.current });

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

  return (
    <>
      <div className="p-4">
        <div className="flex flex-col items-start mb-4">
          <h1 className="text-4xl font-bold">Funcionários Cadastrados</h1>

          {/* Barra de ação */}
          <div className="justify-between w-full flex mt-4 items-center">
            {/* Novo funcionário */}
            <button
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
              onClick={() => setShowFormFunc(true)}
            >
              Novo Funcionário
            </button>

            {/* Busca */}
            <input
              type="text"
              placeholder="Buscar Funcionário..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="border mt-5 bg-white min-w-[500px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ml-4"
            />
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
              <th className="py-2 px-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {funcionariosFiltrados.map((employee) => (
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
                <td className="py-2 px-4">
                  <div className="flex justify-center items-center gap-3">
                    {/* Editar */}
                    <button
                      onClick={() => abrirAlterForm(employee)}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-blue-600 hover:bg-blue-500 flex items-center justify-center hover:scale-110 transition duration-200"
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
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-green-600 hover:bg-green-300 hover:scale-110 transition duration-200"
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
      {showFormFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Cadastro de Funcionário</h2>
              <button
                onClick={() => setShowFormFunc(false)}
                className="text-red-500 font-bold text-xl hover:scale-110 transition duration-300 ease-in-out "
              >
                ✖
              </button>
            </div>
            <FormFunc onClose={listarFuncionarios()} />
          </div>
        </div>
      )}

      {/* Modal de Edição */}
      {MostrarAlterFunc && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold">Alteração de Funcionários</h2>
            <div className="flex justify-end items-center mb-4 ">
              <button
                className="text-red-500 font-bold text-xl hover:scale-110 duration-300 ease-in-out"
                onClick={() => setMostarAlterFunc(false)}
              >
                ✖
              </button>
            </div>
            <AlterForm
              employee={funcSelecionado}
              onClose={() => {
                listarFuncionarios();
                setFuncSelecionado(null);
                setMostarAlterFunc(false);
              }}
            />
          </div>
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
              <button
                className="bg-green-500 text-white rounded-xl w-40 h-13 font-bold hover:text-green-700 hover:scale-110 transition duration-200"
                onClick={() => {
                  ReactToPrintFn();
                  setShowModalCracha(false);
                }}
              >
                Imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

import { useEffect, useState, useRef } from "react";
import carregarFuncionarios from "../../services/api";
import editIcon from "../../assets/editar1.png";
import FormFunc from "./FormFunc";
import ImpressaoCracha from "../ImpCracha/ImpressaoCracha";
import { useReactToPrint } from "react-to-print";
import AlterForm from "./AlterFuncionarios";

import {
  LuLayoutGrid,
  LuClipboardList,
  LuQrCode,
  LuUserCog,
} from "react-icons/lu";

import { FaRegTrashAlt, FaRegEdit } from "react-icons/fa";

export default function ListaFuncionarios() {
  const [funcionarios, setFuncionarios] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showModalCracha, setShowModalCracha] = useState(false);
  const [funcSelecionado, setFuncSelecionado] = useState(null);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  //Controles de Impressão ------------------
  const contentRef = useRef(null);
  const ReactToPrintFn = useReactToPrint({ contentRef });

  //Carerega funcionários -------------------

  const listarFuncionarios = async () => {
    const dados = await carregarFuncionarios(); // sua função que busca dados do backend
    setFuncionarios(dados);
  };

  useEffect(() => {
    async function fetchData() {
      const dados = await carregarFuncionarios();
      setFuncionarios(dados);
    }
    fetchData();
  }, []);

  const funcionariosFiltrados = funcionarios.filter(
    (u) =>
      u.name.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.email.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.sector.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.position.toLowerCase().includes(filtroNome.toLowerCase()) ||
      u.cpf.toLowerCase().includes(filtroNome.toLowerCase())
  );
  const handleEditar = (funcionario) => {
    setFuncSelecionado(funcionario);
    setShowModal(true);
  };
  return (
    <>
      <div className="p-4">
        <div className="flex flex-col items-start mb-4">
          <h1 className="text-4xl font-bold">Funcionários Cadastrados</h1>
          <div className="justify-between w-full flex mt-4">
            <button
              className="bg-green-700 text-white px-4 py-2 rounded hover:bg-green-800 transition"
              onClick={() => setShowModal(true)}
            >
              Novo Funcionário
            </button>
            {showModal && (
              <div
                className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50
                       transition-opacity duration-300 ease-out"
              >
                <div
                  className={`bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto transform 
                          transition-all duration-300 ease-out 
                          ${showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                >
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">
                      Cadastro de Funcionário
                    </h2>
                    <button
                      className="text-red-500 border-2 rounded font-bold text-xl hover:text-red-700 hover:scale-110 bg-red-500 transition duration-200"
                      onClick={() => setShowModal(false)}
                    >
                      ✖
                    </button>
                  </div>
                  <FormFunc employee={""} />
                </div>
              </div>
            )}
            <input
              type="text"
              placeholder="Buscar Funcionário..."
              value={filtroNome}
              onChange={(e) => setFiltroNome(e.target.value)}
              className="border mt-5 bg-white min-w-[500px] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none 
              focus:ring-2 focus:ring-blue-500 ml-4"
            />
          </div>
        </div>
        <table className=" min-w-full border-collapse items-center justify-center border-b border-gray-300">
          <thead className="">
            <tr className="text-center odd:bg-gray-100 border-t border-gray-300 text-xl font-bold">
              <th className="py-2 px-4">Nome</th>
              <th className="py-2 px-4">Email</th>
              <th className="py-2 px-4">Cpf</th>
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
                className="text-center text-md hover:bg-blue-100 transition odd:bg-white even:bg-gray-100 "
              >
                {/* Outras colunas */}
                <td className="py-2 px-4">{employee.name}</td>
                <td className="py-2 px-4">{employee.email}</td>
                <td className="py-2 px-4">{employee.cpf}</td>
                <td className="py-2 px-4">{employee.sector}</td>
                <td className="py-2 px-4">{employee.position}</td>
                <td className="py-2 px-4">
                  {" "}
                  {employee.active === 1 ? "Sim" : "Não"}
                </td>
                <td className="py-2 px-4">
                  <div className="flex justify-center items-center gap-3">
                    {/* Botão Editar */}
                    <button
                      onClick={() => {
                        handleEditar(employee.id);
                        setFuncSelecionado(employee);
                      }}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-blue-600 hover:bg-blue-500 flex items-center justify-center hover:scale-110 transition duration-200"
                    >
                      <FaRegEdit
                        className="h-6 w-6 text-gray-700 cursor-pointer "
                        title="Editar usuário"
                      />
                    </button>
                    {showModal && (
                      <div
                        className="fixed inset-0 flex items-center justify-center backdrop-blur-sm z-50
                       transition-opacity duration-300 ease-out"
                      >
                        <div
                          className={`bg-white p-6 rounded-lg shadow-lg w-[60vw] max-h-[90vh] overflow-y-auto transform 
                          transition-all duration-300 ease-out 
                          ${showModal ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                        >
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold">
                              Cadastro de Funcionário
                            </h2>
                            <button
                              className="text-red-500 border-2 rounded font-bold text-xl hover:text-red-700 hover:scale-110 bg-red-500 transition duration-200"
                              onClick={() => {setShowModal(false); listarFuncionarios(); }}
                            >
                              ✖
                            </button>
                          </div>
                          <AlterForm
                            employee={funcSelecionado}
                            onClose={() => {
                              setFuncSelecionado(null);
                              listarFuncionarios();
                            }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Botão Remover */}
                    <button
                      onClick={() => handleExcluir(employee.id)}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-red-600 hover:bg-red-300  flex items-center justify-center hover:scale-110 transition duration-200"
                    >
                      <FaRegTrashAlt
                        className="h-6 w-6 text-gray-700 cursor-pointer"
                        title="Remover usuário"
                      />
                    </button>

                    <button
                      onClick={() => {
                        setShowModalCracha(true);
                        setFuncSelecionado(employee);
                      }}
                      className="cursor-pointer p-1 rounded-lg bg-transparent border-1 border-green-600 hover:bg-green-300 hover:scale-110 transition duration-200"
                    >
                      <LuQrCode
                        className="h-6 w-6 text-gray-700 cursor-pointer"
                        title="Gera QR Code"
                      />
                    </button>
                    {showModalCracha && (
                      <div className="fixed inset-0 flex items-center justify-center z-50 transition-opacity duration-300 ease-out ">
                        <div
                          className={`bg-[rgb(23,110,150)] p-6 rounded-lg shadow-lg w-[35vw] max-h-[100vh] overflow-y-auto transform 
                          transition-all duration-300 ease-out 
                          ${showModalCracha ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
                        >
                          <div className="flex justify-end items-center ">
                            <button
                              className="text-red-500 border-2 rounded font-bold text-xl hover:text-red-700 hover:scale-110 bg-red-500 transition duration-200"
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
                            className="mt-5 bg-green-500 text-white rounded-xl w-40 h-13 border-2 rounded font-bold text-md hover:text-green-700 hover:scale-110 transition duration-200"
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
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

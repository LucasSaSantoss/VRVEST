import React, { useState, useRef, useEffect } from "react";
import {
  registrarKit,
  getOpenPendencies,
  verificarCpf,
  devolucaoKit,
} from "../services/api";
import PopupEmail from "./QrCodeComponents/CreateEmailPopup";
import ModalSimNao from "./ModalSimNao";

function LeitorQrCode() {
  const [cpf, setCpf] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [pendPopupMessage, setPendPopupMessage] = useState("");
  const [showPendPopup, setShowPendPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [mostrarModalSimNao, setMostrarModalSimNao] = useState(false);
  const [kitSelecionado, setKitSelecionado] = useState(null);
  const [tipoOperacao, setTipoOperacao] = useState("retirada");
  const [isProcessing, setIsProcessing] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [pendenciaSelecionada, setPendenciaSelecionada] = useState(null);
  const [simNaoComNumero, setSimNaoComNumero] = useState(true);
  const [mostrarPopupEmail, setMostrarPopupEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [showModalKitTrauma, setShowModalKitTrauma] = useState(false);
  const [tipoKitTrauma, setTipoKitTrauma] = useState(null);
  const [funcTrauma, setFuncTrauma] = useState(false);
  const cpfInputRef = useRef(null);
  const btnSimRef = useRef(null);
  const btnNaoRef = useRef(null);
  const [nomeColab, setNomeColab] = useState("");

  // Ref para travar processamento no teclado
  const processingRef = useRef(false);

  // Cancela operação
  const cancelarOperacao = () => {
    setKitSelecionado(null);
    setPendenciaSelecionada(null);
    setMostrarModalSimNao(false);
    cpfInputRef.current?.focus();
  };

  // Valida CPF
  const validateCpf = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    const regex = /^\d{11}$/;
    if (!regex.test(cpf)) {
      setCpf("");
      setNomeColab("");
      cpfInputRef.current?.focus();
      setIsSuccess(false);
      return {
        success: false,
        message: "Digite um CPF válido com exatamente 11 números.",
      };
    }

    try {
      const resposta = await verificarCpf(cpf);

      const nomeColaborador = resposta.data?.name || "";
      setNomeColab(nomeColaborador);

      if (resposta.error) {
        return {
          success: false,
          message: "Erro ao verificar CPF.",
        };
      }

      if (resposta.emailRequired) {
        showTemporaryPopup(resposta.message);
        setTimeout(() => {
          setMostrarPopupEmail(true);
        }, 1500);

        return { success: false, message: resposta.message };
      }

      if (!resposta.success) {
        return {
          success: false,
          message: resposta.message,
        };
      }

      if (!resposta.success || !resposta.data) {
        setCpf("");
        cpfInputRef.current?.focus();
        setIsSuccess(false);
        return { success: false, message: "Funcionário não encontrado." };
      }

      cpfInputRef.current?.blur();

      return {
        success: true,
        message: "Funcionário válido.",
        nomeColaborador: nomeColaborador,
        trauma: resposta.trauma,
      };
    } catch (err) {
      console.error(err);
      setCpf("");
      setNomeColab("");
      cpfInputRef.current?.focus();
      setIsSuccess(false);
      return { success: false, message: "Erro ao verificar CPF." };
    }
  };

  // Enter no input do CPF
  const handleCpfEnter = async (e) => {
    if (e.key !== "Enter" || showModal) return;

    const resultado = await validateCpf();
    if (!resultado.success) {
      showTemporaryPopup(resultado.message);
      return;
    }

    try {
      const pendData = await getOpenPendencies({ cpf });
      if (pendData.success && pendData.total > 0) {
        const limite = new Date();
        limite.setHours(limite.getHours() - 36);

        setPendPopupMessage(
          <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-white text-black px-6 py-4 rounded-lg shadow-lg w-[600px]">
              <h2 className="text-xl font-bold mb-4 text-center">
                Pendências em Aberto
              </h2>
              <h3 className="text-center text-2xl font-semibold text-blue-600 mb-4">
                {resultado.nomeColaborador ? resultado.nomeColaborador : ""}
              </h3>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-2 py-1">Data</th>
                    <th className="border border-gray-300 px-2 py-1">
                      Tamanho
                    </th>
                    <th className="border border-gray-300 px-2 py-1">Tipo</th>
                    <th className="border border-gray-300 px-2 py-1">Valor</th>
                    {tipoOperacao === "devolucao" && (
                      <th className="border border-gray-300 px-2 py-1">
                        Selecionar
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {pendData.list.map((p) => {
                    const dataPendencia = new Date(p.date);
                    const podeSelecionar = dataPendencia >= limite;

                    return (
                      <tr key={p.id}>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {new Date(
                            new Date(dataPendencia).getTime() +
                              3 * 60 * 60 * 1000
                          ).toLocaleString("pt-BR")}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {p.kitSize}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {p.kitType ? p.kitType : "-"}
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {p.kitPrice ? "R$" + p.kitPrice : "-"}
                        </td>
                        {tipoOperacao === "devolucao" && (
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {podeSelecionar ? (
                              <>
                                <button
                                  onClick={() => {
                                    setPendenciaSelecionada(p.id);
                                    setMensagem(
                                      "Deseja realmente devolver a pendência selecionada?"
                                    );
                                    setMostrarModalSimNao(true);
                                    setShowPendPopup(false);
                                  }}
                                  className="bg-red-600 hover:bg-red-700 px-3 py-1 rounded-lg text-white font-bold"
                                >
                                  Devolver
                                </button>
                              </>
                            ) : (
                              <span className="text-gray-400 text-sm">
                                Não selecionável
                              </span>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div className="w-full mt-2 items-center">
                <div className="flex bg-gray-100 font-bold border border-gray-300">
                  <div className="px-2 py-1 text-right flex-1">Total</div>
                  <div className="px-2 py-1 flex-1">
                    R$
                    {pendData.list
                      .reduce((acc, p) => {
                        const valorNum = parseFloat(
                          p.kitPrice ? p.kitPrice.replace(",", ".") : "0"
                        );
                        return acc + (isNaN(valorNum) ? 0 : valorNum);
                      }, 0)
                      .toFixed(2)
                      .replace(".", ",")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        setFuncTrauma(resultado.trauma);
        setShowPendPopup(true);
      } else {
        if (tipoOperacao === "devolucao") {
          showTemporaryPopup("Nenhuma pendência encontrada para devolução.");
          setCpf("");
          setNomeColab("");
          cpfInputRef.current?.focus();
        } else {
          setFuncTrauma(resultado.trauma);
          if (resultado.trauma) {
            setShowModalKitTrauma(true);
          } else {
            setTipoKitTrauma("COMUM");
            setShowModal(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      showTemporaryPopup("Erro ao verificar pendências.");
    }
  };

  useEffect(() => {
    if (pendenciaSelecionada) {
      console.log("Estado atualizado:", pendenciaSelecionada);
    }
  }, [pendenciaSelecionada]);

  // Popup temporário
  const showTemporaryPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 2000);
  };

  // Listener do teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showPendPopup) {
        setShowPendPopup(false);
        if (tipoOperacao === "retirada") {
          if (funcTrauma) {
            setShowModalKitTrauma(true);
          } else {
            setTipoKitTrauma("COMUM");
            setShowModal(true);
          }
        } else {
          if (pendenciaSelecionada) {
            setMensagem("Deseja realmente devolver a pendência selecionada?");
            setMostrarModalSimNao(true);
          } else {
            setIsSuccess(false);
            showTemporaryPopup(
              "Não existem pendências para baixar ou nenhuma foi selecionada."
            );
            cpfInputRef.current?.focus();
          }
        }
        return;
      }

      if (mostrarModalSimNao) {
        if (e.key === "1") {
          if (processingRef.current) return;
          if (tipoOperacao === "retirada") {
            handleKitSelection(kitSelecionado);
          } else {
            handleDevolucao();
          }
        } else if (e.key === "2") {
          cancelarOperacao();
        }
        return;
      }

      if (showModal) {
        switch (e.key) {
          case "1":
            setKitSelecionado("P");
            setMensagem("Tamanho P selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "2":
            setKitSelecionado("M");
            setMensagem("Tamanho M selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "3":
            setKitSelecionado("G");
            setMensagem("Tamanho G selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "4":
            setKitSelecionado("GG");
            setMensagem("Tamanho GG selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "5":
            setKitSelecionado("XXG");
            setMensagem("Tamanho XXG selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "6":
            setKitSelecionado("EXG");
            setMensagem("Tamanho EXG selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          case "7":
            setKitSelecionado("G1");
            setMensagem("Tamanho G1 selecionado. Deseja prosseguir?");
            setMostrarModalSimNao(true);
            break;
          default:
            setShowModal(false);
            setMensagem("");
            cpfInputRef.current?.focus();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [
    showModal,
    mostrarModalSimNao,
    showPendPopup,
    kitSelecionado,
    tipoOperacao,
    cpf,
    pendenciaSelecionada,
  ]);

  useEffect(() => {
    if (!showModalKitTrauma) return;

    const handleKey = (e) => {
      if (e.key === "1") {
        setTipoKitTrauma("COMUM");
        setShowModalKitTrauma(false);
        setShowModal(true);
      }

      if (e.key === "2") {
        setTipoKitTrauma("TRAUMA");
        setShowModalKitTrauma(false);
        setShowModal(true);
      }

      if (e.key !== "1" && e.key !== "2") {
        setShowModalKitTrauma(false);
        cpfInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => window.removeEventListener("keydown", handleKey);
  }, [showModalKitTrauma]);

  // Foco automático no botão Sim
  useEffect(() => {
    if (mostrarModalSimNao) {
      btnSimRef.current?.focus();
    }
  }, [mostrarModalSimNao]);

  // Retirada de kit
  const handleKitSelection = async (kitSize) => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessing(true);

    try {
      if (tipoOperacao === "retirada") {
        const response = await registrarKit({
          cpf,
          kitSize,
          kitType: tipoKitTrauma,
        });
        if (response.success) {
          showTemporaryPopup(`Saída de kit registrada! Tamanho: ${kitSize}`);
          setCpf("");
          setNomeColab("");
          setIsSuccess(true);
          setShowModal(false);
          setMostrarModalSimNao(false);
          cpfInputRef.current?.focus();
        } else {
          setIsSuccess(false);
          setMostrarModalSimNao(false);
          showTemporaryPopup(response.message || "Erro ao registrar o kit.");
          cpfInputRef.current?.focus();
        }
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setMostrarModalSimNao(false);
      showTemporaryPopup(err.message || "Erro no servidor.");
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
      cpfInputRef.current?.focus();
    }
  };

  // Processa devolução
  const handleDevolucao = async () => {
    if (!pendenciaSelecionada) {
      setMostrarModalSimNao(false);
      showTemporaryPopup("Selecione uma pendência para devolver.");
      return;
    }

    setIsProcessing(true);
    setPopupMessage("Processando devolução e envio de e-mail...");
    setMostrarModalSimNao(false);
    setShowPopup(true);

    try {
      const response = await devolucaoKit({
        cpf,
        id: pendenciaSelecionada,
      });

      if (response.success && !response.expired) {
        setMostrarModalSimNao(false);
        setPopupMessage("Devolução de kit registrada!");
        setCpf("");
        setNomeColab("");
        setIsSuccess(true);
        setPendenciaSelecionada(null);
      } else if (response.expired) {
        setPopupMessage(
          response.message ||
            "A última pendência encontrada está fora do prazo de 36hrs."
        );
        setIsSuccess(false);
        setMostrarModalSimNao(false);
      } else {
        setPopupMessage(response.message || "Erro ao devolver o kit.");
        setIsSuccess(false);
        setMostrarModalSimNao(false);
      }
    } catch (err) {
      setPopupMessage("Erro ao processar devolução.");
      setMostrarModalSimNao(false);
    } finally {
      setIsProcessing(false);
      setMostrarModalSimNao(false);
      setTimeout(() => setShowPopup(false), 2000);
      cpfInputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col w-[500px] mx-auto mt-[10rem] p-8 bg-gradient-to-b from-cyan-50 to-white border-2 border-cyan-400 rounded-2xl shadow-2xl items-center transition-all">
      <h1 className="text-3xl font-bold text-cyan-700 mb-6 text-center">
        Leitor de QR Code
      </h1>

      {/* Input QR */}
      <label
        htmlFor="qrCodeNum"
        className="text-lg font-semibold text-gray-700"
      ></label>
      <input
        ref={cpfInputRef}
        id="qrCodeNum"
        type="text"
        inputMode="numeric"
        placeholder=" Escaneie o QR Code:"
        pattern="\d*"
        maxLength={11}
        value={cpf}
        onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
        onKeyDown={handleCpfEnter}
        className="mt-3 p-3 border-2 border-cyan-300 rounded-xl w-full text-lg focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-gray-400 transition"
      />

      {/* Botões de operação */}
      <div className="flex gap-4 mt-6 w-full justify-center">
        <button
          onClick={() => {
            (setTipoOperacao("retirada"), cpfInputRef.current?.focus());
          }}
          onDoubleClick={() => handleCpfEnter({ key: "Enter" })}
          className={`flex-1 px-6 py-3 rounded-xl font-bold text-xl transition
        ${
          tipoOperacao === "retirada"
            ? "bg-blue-600 text-white shadow-lg hover:bg-blue-700"
            : "bg-blue-100 text-white shadow-md hover:bg-blue-400"
        }`}
        >
          Retirada
        </button>

        <button
          onClick={() => {
            (setTipoOperacao("devolucao"), cpfInputRef.current?.focus());
          }}
          onDoubleClick={() => handleCpfEnter({ key: "Enter" })}
          className={`flex-1 px-6 py-3 rounded-xl font-bold text-xl transition
        ${
          tipoOperacao === "devolucao"
            ? "bg-red-600 text-white shadow-lg hover:bg-red-700"
            : "bg-red-100 text-white shadow-md hover:bg-red-400"
        }`}
        >
          Devolução
        </button>
      </div>

      {/* Popup de sucesso/erro */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div
            className={`px-6 py-3 rounded-lg shadow-lg text-white font-semibold animate-fadeInOut ${isSuccess ? (tipoKitTrauma === "TRAUMA" ? "bg-blue-500" : "bg-green-500") : "bg-red-500"}`}
          >
            {popupMessage}
          </div>
        </div>
      )}

      {/* Popup de pendências */}
      {showPendPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-red-700 text-white text-xl px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {pendPopupMessage}
          </div>
        </div>
      )}
      {mostrarPopupEmail && (
        <PopupEmail
          cpf={cpf}
          onClose={() => setMostrarPopupEmail(false)}
          showTemporaryPopup={showTemporaryPopup}
          onSuccess={() => {
            setMostrarPopupEmail(false);
            setShowModal(true);
          }}
        />
      )}

      {/* Modal de seleção de KIT */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm ">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-96">
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              Selecione o KIT
            </h2>
            <h3 className="text-center text-2xl font-semibold text-blue-600 mb-4">
              {nomeColab}
            </h3>
            <div className="grid grid-cols-4 gap-4 justify-center mb-6">
              {[
                { kit: "P", numero: 1 },
                { kit: "M", numero: 2 },
                { kit: "G", numero: 3 },
                { kit: "GG", numero: 4 },
                { kit: "XXG", numero: 5 },
                { kit: "EXG", numero: 6 },
                { kit: "G1", numero: 7 },
              ].map(({ kit, numero }) => (
                <div key={kit} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setKitSelecionado(kit);
                      setMostrarModalSimNao(true);
                      setTipoKitTrauma("COMUM");
                      setMensagem(`Tamanho ${kit}. Deseja prosseguir?`);
                    }}
                    className={`w-16 h-16 rounded-lg ${tipoKitTrauma === "COMUM" ? "bg-green-500 hover:bg-green-600 text-white" : "bg-blue-700 hover:bg-blue-800 text-white"}  font-bold text-lg shadow-md transition`}
                  >
                    {kit}
                  </button>
                  <span className="mt-2 font-semibold text-gray-700">
                    {numero}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                setShowModal(false);
                cpfInputRef.current?.focus();
              }}
              className="bg-gray-400 text-white px-4 py-2 rounded-lg w-full hover:bg-gray-600 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
      {showModalKitTrauma && (
        <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white p-6 rounded-2xl shadow-2xl w-96">
            <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
              Escolha o tipo de KIT
            </h2>

            <div className="flex flex-col items-center gap-6">
              {/* GRID COM OS 2 TIPOS DE KIT */}
              <div className="grid grid-cols-2 gap-6 justify-items-center w-full">
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setTipoKitTrauma("COMUM");
                      setShowModalKitTrauma(false);
                      setShowModal(true);
                    }}
                    className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 shadow-md w-32 text-center"
                  >
                    KIT COMUM
                  </button>
                  <p className="mt-2 text-gray-700 font-semibold text-lg">1</p>
                </div>

                <div className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setTipoKitTrauma("TRAUMA");
                      setShowModalKitTrauma(false);
                      setShowModal(true);
                    }}
                    className="bg-blue-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 shadow-md w-32 text-center"
                  >
                    KIT TRAUMA
                  </button>
                  <p className="mt-2 text-gray-700 font-semibold text-lg">2</p>
                </div>
              </div>

              {/* BOTÃO CANCELAR CENTRALIZADO */}
              <button
                onClick={() => {
                  setShowModalKitTrauma(false);
                  cpfInputRef.current?.focus();
                }}
                className="bg-cyan-500 text-white px-4 py-2 rounded-lg w-full hover:bg-cyan-600 transition text-center font-bold"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal Sim/Não */}
      <ModalSimNao
        mostrar={mostrarModalSimNao}
        onConfirmar={() =>
          tipoOperacao === "retirada"
            ? handleKitSelection(kitSelecionado)
            : handleDevolucao()
        }
        onCancelar={cancelarOperacao}
        btnSimRef={btnSimRef}
        btnNaoRef={btnNaoRef}
        isProcessing={isProcessing}
        mensagem={mensagem}
        simNaoComNumero={simNaoComNumero}
      />

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
      `}</style>
    </div>
  );
}

export default LeitorQrCode;

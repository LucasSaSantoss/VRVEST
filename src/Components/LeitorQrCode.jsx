import React, { useState, useRef, useEffect } from "react";
import {
  registrarKit,
  getOpenPendencies,
  verificarCpf,
  devolucaoKit,
} from "../services/api";
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

  const cpfInputRef = useRef(null);
  const btnSimRef = useRef(null);
  const btnNaoRef = useRef(null);

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
    const regex = /^\d{11}$/;
    if (!regex.test(cpf)) {
      setCpf("");
      cpfInputRef.current?.focus();
      setIsSuccess(false);
      return {
        success: false,
        message: "Digite um CPF válido com exatamente 11 números.",
      };
    }

    try {
      const resposta = await verificarCpf(cpf);
      if (!resposta.success || !resposta.data) {
        setCpf("");
        cpfInputRef.current?.focus();
        setIsSuccess(false);
        return {
          success: false,
          message: resposta.message || "CPF não encontrado.",
        };
      }
      cpfInputRef.current?.blur();
      return { success: true, message: "Funcionário válido." };
    } catch (err) {
      console.error(err);
      setCpf("");
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
      const valorKit = 50;

      if (pendData.success && pendData.total > 0) {
        const limite = new Date();
        limite.setHours(limite.getHours() - 36);

        setPendPopupMessage(
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white text-black px-6 py-4 rounded-lg shadow-lg w-[600px]">
              <h2 className="text-xl font-bold mb-4 text-center">
                Pendências em Aberto
              </h2>
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-200">
                    <th className="border border-gray-300 px-2 py-1">Data</th>
                    <th className="border border-gray-300 px-2 py-1">
                      Tamanho
                    </th>
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
                        <td className="border border-gray-300 px-2 py-1">
                          {dataPendencia.toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {p.kitSize}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          R$ {valorKit}
                        </td>
                        {tipoOperacao === "devolucao" && (
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {podeSelecionar ? (
                              <input
                                id={p.id}
                                type="radio"
                                name="pendencia"
                                value={p.id}
                                onChange={(e) =>
                                  setPendenciaSelecionada(e.target.value)
                                }
                              />
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
                    R$ {pendData.list.length * valorKit}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        setShowPendPopup(true);
      } else {
        if (tipoOperacao === "devolucao") {
          showTemporaryPopup("Nenhuma pendência encontrada para devolução.");
          setCpf("");
          cpfInputRef.current?.focus();
        } else {
          setShowModal(true);
        }
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      showTemporaryPopup("Erro ao verificar pendências.");
    }
  };

  // Popup temporário
  const showTemporaryPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // Listener do teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showPendPopup) {
        setShowPendPopup(false);
        if (tipoOperacao === "retirada") {
          setShowModal(true);
        } else {
          if (pendenciaSelecionada) {
            console.log(pendenciaSelecionada);
            setMensagem("Deseja realmente devolver a pendência selecionada?");
            setMostrarModalSimNao(true);
          } else {
            console.log(pendenciaSelecionada);
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
  ]);

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
        const response = await registrarKit({ cpf, kitSize });
        if (response.success) {
          showTemporaryPopup(`Saída de kit registrada! Tamanho: ${kitSize}`);
          setCpf("");
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
      setTimeout(() => setShowPopup(false), 3000);
      cpfInputRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col w-[400px] mx-auto mt-[25vh] border-2 border-[#2faed4] rounded-[15px] p-12 shadow-xl/20 items-center">
      <label htmlFor="qrCode" className="text-2x1 font-large">
        QR Code:
      </label>
      <input
        ref={cpfInputRef}
        id="qrCodeNum"
        type="text"
        inputMode="numeric"
        placeholder="Escaneie o QR Code"
        pattern="\d*"
        maxLength={11}
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        onKeyDown={handleCpfEnter}
        className="mt-4 p-3 border-2 border-[#2faed4] rounded-[25px] w-[300px] text-lg"
      />

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setTipoOperacao("retirada")}
          className={`px-6 py-3 rounded-lg font-bold text-xl transition ${
            tipoOperacao === "retirada"
              ? "bg-blue-500 text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Retirada
        </button>

        <button
          onClick={() => setTipoOperacao("devolucao")}
          className={`px-6 py-3 rounded-lg font-bold text-xl transition ${
            tipoOperacao === "devolucao"
              ? "bg-red-500 text-white shadow-lg"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Devolução
        </button>
      </div>

      {/* Popup */}
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
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

      {/* Popup pendências */}
      {showPendPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-red-700 text-white text-2xl px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {pendPopupMessage}
          </div>
        </div>
      )}

      {/* Modal seleção de kit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-center">
              Selecione o KIT que será retirado
            </h2>
            <div className="flex justify-center gap-6 mb-4">
              {[
                { kit: "P", numero: 1 },
                { kit: "M", numero: 2 },
                { kit: "G", numero: 3 },
                { kit: "GG", numero: 4 },
              ].map(({ kit, numero }) => (
                <div key={kit} className="flex flex-col items-center">
                  <button
                    onClick={() => {
                      setKitSelecionado(kit);
                      setMostrarModalSimNao(true);
                      setMensagem(`Tamanho ${kit}. Deseja prosseguir?`);
                    }}
                    className="w-16 h-16 rounded-md bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                  >
                    {kit}
                  </button>
                  <span className="mt-2 text-sm font-semibold">{numero}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setShowModal(false);
                cpfInputRef.current?.focus();
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
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

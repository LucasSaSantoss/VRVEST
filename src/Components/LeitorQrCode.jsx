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

  const cpfInputRef = useRef(null);
  const btnSimRef = useRef(null);
  const btnNaoRef = useRef(null);

  // Cancela operação ----------------------------------------------------------
  const cancelarOperacao = () => {
    setKitSelecionado(null);
    setMostrarModalSimNao(false);
    cpfInputRef.current?.focus();
  };

  // Valida CPF ----------------------------------------------------------------
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

  // Enter no input do CPF ------------------------------------------------------
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
        const infoPend = pendData.list.map((p) => (
          <div key={p.id}>
            {new Date(p.date).toLocaleDateString()} - Tamanho do Kit:{" "}
            {p.kitSize} - Valor: {valorKit}
          </div>
        ));

        setPendPopupMessage(
          <div>
            <div>
              Este funcionário possui {pendData.total} pendência(s) em aberto:
            </div>
            {infoPend}
            <div>-------------------------------------------</div>
            <div>Total das pendências: {pendData.total * valorKit}</div>
          </div>
        );
        setShowPendPopup(true);
      } else {
        if (tipoOperacao === "devolucao") {
          setMostrarModalSimNao(true);
        } else {
          setShowModal(true); // retirada continua pedindo tamanho
        }
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      showTemporaryPopup("Erro ao verificar pendências.");
    }
  };

  // Popup temporário -------------------------------------------------------------
  const showTemporaryPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  // Controlador dos Listeners do teclado ----------------------------------------------------
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (showPendPopup) {
        setShowPendPopup(false);
        setShowModal(true);
        return;
      }

      if (mostrarModalSimNao) {
        if (e.key === "1") handleKitSelection(kitSelecionado);
        else if (e.key === "2") cancelarOperacao();
        return;
      }

      if (showModal) {
        switch (e.key) {
          case "1":
            setKitSelecionado("P");
            setMostrarModalSimNao(true);
            break;
          case "2":
            setKitSelecionado("M");
            setMostrarModalSimNao(true);
            break;
          case "3":
            setKitSelecionado("G");
            setMostrarModalSimNao(true);
            break;
          case "4":
            setKitSelecionado("GG");
            setMostrarModalSimNao(true);
            break;
          default:
            setShowModal(false);
            cpfInputRef.current?.focus();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showModal, mostrarModalSimNao, showPendPopup, kitSelecionado]);

  // Foco automático no botão Sim do modal ----------------------------------------------------
  useEffect(() => {
    if (mostrarModalSimNao) {
      btnSimRef.current?.focus();
    }
  }, [mostrarModalSimNao]);

  const handleKitSelection = async (kitSize) => {
    try {
      if (tipoOperacao === "retirada") {
        const response = await registrarKit({ cpf, kitSize });
        if (response.success) {
          showTemporaryPopup(`Saída de kit registrada! Tamanho: ${kitSize}`);
          setCpf("");
          setIsSuccess(true);
          setShowModal(false);
          setMostrarModalSimNao(false);
        } else {
          setIsSuccess(false);
          setMostrarModalSimNao(false);
          showTemporaryPopup(response.message || "Erro ao registrar o kit.");
        }
      } else if (tipoOperacao === "devolucao") {
        const response = await devolucaoKit({ cpf });
        if (response.success) {
          showTemporaryPopup(`Devolução de kit registrada!`);
          setCpf("");
        } else {
          showTemporaryPopup(response.message || "Erro ao devolver o kit.");
        }
        setMostrarModalSimNao(false); // fecha o modal
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      setMostrarModalSimNao(false);
      showTemporaryPopup(err.message || "Erro no servidor.");
    } finally {
      cpfInputRef.current?.focus();
    }
  };
  //-----------------------------------------------------------------------------------------------------------
  return (
    <div className="flex flex-col w-[400px] mx-auto mt-30 border-2 border-[#2faed4] rounded-[15px] p-12 shadow-xl/20 items-center">
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

      <div className="flex gap-6 mt-6">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tipoOperacao"
            value="retirada"
            checked={tipoOperacao === "retirada"}
            onChange={(e) => setTipoOperacao(e.target.value)}
          />
          Retirada
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="tipoOperacao"
            value="devolucao"
            checked={tipoOperacao === "devolucao"}
            onChange={(e) => setTipoOperacao(e.target.value)}
          />
          Devolução
        </label>
      </div>

      {/* Popup */}
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

      {/* Popup pendências */}
      {showPendPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {pendPopupMessage}
          </div>
        </div>
      )}

      {/* Modal de seleção kit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-center">
              Selecione o KIT que será retirado
            </h2>
            <div className="flex justify-center gap-6 mb-4">
              {["P", "M", "G", "GG"].map((kit) => (
                <button
                  key={kit}
                  onClick={() => {
                    setKitSelecionado(kit);
                    setMostrarModalSimNao(true);
                  }}
                  className="w-16 h-16 rounded-md bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                >
                  {kit}
                </button>
              ))}
            </div>

            {/* Modal Sim/Não exclusivo para devolução */}
            {mostrarModalSimNao &&
              tipoOperacao === "devolucao" &&
              !showModal && (
                <ModalSimNao
                  mostrar={mostrarModalSimNao}
                  onConfirmar={() => handleKitSelection(null)} // null porque não precisa do tamanho
                  onCancelar={cancelarOperacao}
                  btnSimRef={btnSimRef}
                  btnNaoRef={btnNaoRef}
                />
              )}

            <ModalSimNao
              mostrar={mostrarModalSimNao}
              onConfirmar={() => handleKitSelection(kitSelecionado)}
              onCancelar={cancelarOperacao}
              btnSimRef={btnSimRef}
              btnNaoRef={btnNaoRef}
            />
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

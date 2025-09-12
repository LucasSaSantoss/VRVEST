import React, { useState, useRef, useEffect } from "react";
import { registrarKit, getOpenPendencies, verificarCpf } from "../services/api";

function LeitorQrCode() {
  const [cpf, setCpf] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [pendPopupMessage, setPendPopupMessage] = useState("");
  const [showPendPopup, setShowPendPopup] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const cpfInputRef = useRef(null);

  // Valida CPF e retorna resultado
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

      if (!resposta.success) {
        setCpf("");
        cpfInputRef.current?.focus();
        setIsSuccess(false);
        return {
          success: false,
          message:
            resposta.message || "Erro ao verificar CPF, tente novamente.",
        };
      }

      if (resposta.data) {
        return { success: true, message: "Funcionário válido." };
      }

      setCpf("");
      cpfInputRef.current?.focus();
      setIsSuccess(false);
      return { success: false, message: "CPF não encontrado." };
    } catch (err) {
      console.error(err);
      setCpf("");
      cpfInputRef.current?.focus();
      setIsSuccess(false);
      return { success: false, message: "Erro ao verificar CPF." };
    }
  };

  const handleCpfEnter = async (e) => {
    if (e.key !== "Enter" || showModal) return;

    const resultado = await validateCpf();

    if (!resultado.success) {
      showTemporaryPopup(resultado.message);
      return;
    }

    try {
      // Consulta pendências abertas
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

        setTimeout(() => {
          setShowPendPopup(false);
          setShowModal(true); // abre modal após mostrar pendências
        }, 3000);
      } else {
        setShowModal(true); // abre modal direto se não houver pendências
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      showTemporaryPopup("Erro ao verificar pendências.");
    }
  };

  // Registra kit selecionado
  const handleKitSelection = async (kitSize) => {
    try {
      const response = await registrarKit({ cpf, kitSize });

      if (response.success) {
        showTemporaryPopup(`Saída de kit registrada! Tamanho: ${kitSize}`);
        setCpf("");
        setIsSuccess(true);
        setShowModal(false);
      } else {
        setIsSuccess(false);
        showTemporaryPopup(response.message || "Erro ao registrar o kit.");
      }
    } catch (err) {
      console.error(err);
      setIsSuccess(false);
      showTemporaryPopup(err.message || "Erro no servidor.");
    } finally {
      cpfInputRef.current?.focus();
    }
  };

  // Função para mostrar popup temporário
  const showTemporaryPopup = (message) => {
    setPopupMessage(message);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  //Validação Teclado
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!showModal) return;

      switch (e.key) {
        case "1":
          handleKitSelection("P");
          break;
        case "2":
          handleKitSelection("M");
          break;
        case "3":
          handleKitSelection("G");
          break;
        default:
          setShowModal(false);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [showModal, cpf]);

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

      {/* Popup de mensagens gerais */}
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

      {/* Popup de pendências */}
      {showPendPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {pendPopupMessage}
          </div>
        </div>
      )}

      {/* Modal de seleção de kit */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-center">
              Selecione o KIT que será retirado
            </h2>
            <div className="flex justify-center gap-6 mb-4">
              {["P", "M", "G"].map((kit) => (
                <button
                  key={kit}
                  onClick={() => handleKitSelection(kit)}
                  className="w-16 h-16 rounded-md bg-gray-200 hover:bg-gray-300 font-bold text-lg"
                >
                  {kit}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowModal(false)}
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
        .animate-fadeInOut {
          animation: fadeInOut 3s forwards;
        }
      `}</style>
    </div>
  );
}

export default LeitorQrCode;

import React, { useState, useEffect } from "react";
import { registrarKit, getOpenPendencies } from "../services/api";

function LeitorQrCode() {
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [pendPopupMessage, setPendPopupMessage] = useState("");
  const [showPendPopup, setShowPendPopup] = useState(false);

  // const token = localStorage.getItem("token");

  // Valida CPF antes de abrir o modal
  const validateCpf = () => {
    const regex = /^\d{11}$/;
    if (!regex.test(cpf)) {
      setError("Digite um CPF válido com exatamente 11 números.");
      return false;
    }
    setError("");
    return true;
  };

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
    return () => {
      window.removeEventListener("keydown", handleKeyPress);
    };
  }, [showModal, cpf]);

  // Abre modal se o CPF estiver válido
  const handleCpfEnter = async (e) => {
    if (e.key === "Enter" && validateCpf() && !showModal) {
      try {
        // Consulta pendências abertas
        const pendData = await getOpenPendencies({ cpf });
        const valorKit = 50;
        const valorTotalKits = pendData.total * valorKit;

        if (pendData.success && pendData.total > 0) {
          const infoPend = pendData.list.map((p) => (
            <div key={p.id}>
              {" "}
              {new Date(p.date).toLocaleDateString()} - Tamanho do Kit:{" "}
              {p.kitSize} - {" "} Valor:{" "} {valorKit}
            </div>
          ));

          setPendPopupMessage(
            <div>
              <div>
                Este funcionário possui {pendData.total} pendência(s) em aberto:
              </div>
              {infoPend}
              <div>---------------------------------------------------------------</div>
              <div>Total das pendências: {valorTotalKits}</div>
            </div>
          );
          setShowPendPopup(true);

          // Oculta popup após 5 segundos e abre modal
          setTimeout(() => {
            setShowPendPopup(false);
            setShowModal(true);
          }, 3000);
        } else {
          setShowModal(true);
        }
      } catch (err) {
        console.error(err);
        setError("Erro ao verificar pendências.");
      }
    }
  };

  const handleKitSelection = async (kitSize) => {
    try {
      const response = await registrarKit({ cpf, kitSize });
      if (response.success) {
        setPopupMessage(`Saída de kit registrada! Tamanho: ${kitSize}`);
        setShowPopup(true);
        setCpf("");
        setShowModal(false);

        // Oculta popup após 3 segundos
        setTimeout(() => setShowPopup(false), 3000);
      } else {
        setError(response.message || "Erro ao registrar o kit.");
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "Erro no servidor.");
    }
  };

  return (
    <div className="flex flex-col w-[400px] mx-auto w-100 items-center justify-center mt-30 border-2 border-[#2faed4] rounded-[15px] p-12 shadow-xl/20">
      <label htmlFor="qrCode" className="text-2x1 font-large ">
        QR Code:
      </label>
      <input
        type="text"
        id="qrCodeNum"
        inputMode="numeric"
        placeholder="Escaneie o QR Code"
        pattern="\d*"
        maxLength={11}
        value={cpf}
        onChange={(e) => setCpf(e.target.value)}
        onKeyDown={handleCpfEnter}
        className="mt-4 p-3 border-2 border-[#2faed4] rounded-[25px] w-[300px] text-lg"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}

      {/* Popup de pendências */}
      {showPendPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-yellow-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {pendPopupMessage}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center  bg-opacity-50 z-50">
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
      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {popupMessage}
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

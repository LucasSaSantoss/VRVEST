import React, { useState } from "react";
import { verificaCpf } from "../services/api";

function LeitorQrCode() {
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalKit, setModalKit] = useState(false);

  function capturarTecla(event) {
    const teclaEscolhida = event.key;

    if (["1", "2", "3"].includes(teclaEscolhida)) {
      return teclaEscolhida;
    } else {
      return null;
    }
  }

  document.addEventListener("keydown", (event) => {
    const resultado = capturarTecla(event);
    if (resultado) {
      return "1";
    }
  });

  const tamanhoKit = (valor) => {
    setModalKit(valor);
    setShowModal(false);
    setCpf("");
    console.log(valor);
  };

  const validateDigits = () => {
    const regex = /^\d{11}$/;
    if (!regex.test(cpf)) {
      setError("Digite um CPF válido com exatamente 11 números.");
      setShowModal(false);
      setCpf("");
    } else {
      setError("");
      setShowModal(true);
    }
  };

  const handleKeyDown = (e) => {
  if (e.key === "Enter") {
    if (showModal) {
      setShowModal(false);
    } else {
      const regex = /^\d{11}$/;
      if (regex.test(cpf)) {
        setError("");
        setShowModal(true);
        handleCpfValidation(e);
      } else {
        setError("Digite um CPF válido com exatamente 11 números.");
        setShowModal(false);
        setCpf("");
      }
    }
  }
};

  const handleCpfValidation = async (e) => {
    e.preventDefault();
    setError("");

    try {
      console.log('teste')
      const response = await verificaCpf({ cpf });
      console.log('teste2')

      const data = response.data || response;

      if (data.success) {
        console.log('Deu certo')
      } else {
        setError("Deu errado.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao conectar ao servidor.");
    }
  };

  return (
    <div className="flex flex-col ml-[30vw] w-100 items-center justify-center mt-30 border-2 border-[#2faed4] rounded-[15px] p-12 shadow-xl/20">
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
        onBlur={validateDigits}
        onKeyDown={handleKeyDown}
        className="mt-4 p-3 border-2 border-[#2faed4] rounded-[25px] w-[300px] text-lg"
      />
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-transparent bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg ">
            <h2 className="text-xl font-bold mb-8">
              Selecione o KIT que será retirado.
            </h2>
            <div className="flex flex-row justify-center mb-4 gap-6">
              <div className="flex flex-col items-center">
                <button
                  className="border-2 w-15 h-15 rounded-md whitesmoke shadow-xl/10 "
                  onClick={() => tamanhoKit("P")}
                  onKeyDown={(e) => setModalKit(e.target.value)}
                >
                  P
                </button>
                <label className="">1</label>
              </div>
              <div className="flex flex-col items-center ">
                <button
                  className="border-2 w-15 h-15 rounded-md whitesmoke shadow-xl/10 "
                  onClick={() => tamanhoKit("M")}
                >
                  M
                </button>
                <label className="">2</label>
              </div>
              <div className="flex flex-col items-center">
                <button
                  className="border-2 w-15 h-15 rounded-md whitesmoke shadow-xl/10 "
                  onClick={() => tamanhoKit("G")}
                  onKeyDown={() => tamanhoKit("G")}
                >
                  G
                </button>
                <label className="">3</label>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="bg-blue-500 text-white px-4 py-2 rounded mt-3"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
export default LeitorQrCode;

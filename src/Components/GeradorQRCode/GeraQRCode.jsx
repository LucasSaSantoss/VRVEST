import { useState } from "react";
import QRCode from "react-qr-code";
import HeaderQRCode from "../HeaderQRCode";

export default function UsuariosCadastrados() {
  const [cpf, setCpf] = useState("");
  const [mostrarQr, setMostrarQr] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cpf.trim() !== "") {
      setMostrarQr(true);
    }
  };

  return (
    <>
      <section className="flex flex-row bg-[#2faed4] h-[30vh] items-center place-content-between">
        <HeaderQRCode />
        <img
          className="w-[23vw] h-[20vh] mr-10"
          src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
          alt="VR Vest Image"
        />
      </section>
      <div className="flex flex-col items-center justify-center bg-gray-100 mt-[10vh]">
        {/* Cabeçalho */}
        <h1 className="text-2xl font-bold mb-6">Consulta CPF</h1>

        {/* Formulário */}
        <form
          onSubmit={handleSubmit}
          className="bg-white shadow-lg rounded-2xl p-6 w-80 flex flex-col items-center"
        >
          <label className="w-full text-left text-gray-700 mb-2 font-medium">
            Digite o CPF:
          </label>
          <input
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
            className="w-full border rounded-lg p-2 mb-4 focus:ring focus:ring-blue-300 outline-none"
          />

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Gerar QR Code
          </button>
        </form>

        {/* Resultado */}
        {mostrarQr && (
          <div className="mt-8 bg-white p-4 rounded-xl shadow-md flex flex-col items-center">
            <QRCode value={cpf} size={180} />
            <p className="mt-4 text-gray-700 font-medium">{cpf}</p>
          </div>
        )}
      </div>
    </>
  );
}

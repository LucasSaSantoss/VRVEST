import logoRio from "../../assets/logoRio.png";
import QrCodeGenerator from "../GeradorQRCode/GeradorQrCodes";

export default function ImpressaoCracha({ cpf, nome }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5 text-center text-white">
        Impressão de Crachá
      </h2>

      <div className="flex justify-center h-[35vh] items-center">
        <section
          className="flex flex-col border-4 border-gray-300 rounded-lg p-0 
          w-[189px] h-[302px] bg-white shadow-lg gap-1"
        >
          {/* CPF */}
          <div className="flex flex-col items-center">
            <label htmlFor="cpfFuncionario" className="text-sm font-semibold">
              CPF
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-md text-sm w-[150px] text-center"
              value={cpf}
              readOnly
            />
          </div>

          {/* Nome */}
          <div className="flex flex-col items-center">
            <label htmlFor="nomeFuncionario" className="text-sm font-semibold">
              Nome do Funcionário
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-md text-sm w-[150px] text-center"
              value={nome}
              readOnly
            />
          </div>

          {/* QR Code */}
          <div className="flex justify-center items-center mt-5">
            <div className="border-2 border-gray-400 rounded-sm">
              <QrCodeGenerator cpf={cpf} />
            </div>
          </div>

          {/* Logo */}
          <div className="flex justify-center bg-transparent">
            <img
              className="w-[6vw] h-[8vh] object-contain"
              src={logoRio}
              alt="Logo Rio"
            />
          </div>
        </section>
      </div>
    </div>
  );
}

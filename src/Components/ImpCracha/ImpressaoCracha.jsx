import logoRio from "../../assets/LogoRio.png";
import QrCodeGenerator from "../GeradorQRCode/GeradorQrCodes";

export default function ImpressaoCracha({ cpf, nome }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5 text-center text-white">
        Impressão de Crachá
      </h2>

      <div className="flex justify-center h-[50vh]">
        <section
          className="flex flex-col border-4 border-gray-300 rounded-lg p-0 
          w-[189px] h-[302px] bg-white shadow-lg gap-1"
        >
          {/* CPF */}
          <div className="flex flex-col ">
            <label htmlFor="cpfFuncionario" className="text-sm font-semibold">
              CPF
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-md text-sm w-full text-center"
              value={cpf}
              readOnly
            />
          </div>

          {/* Nome */}
          <div className="flex flex-col">
            <label htmlFor="nomeFuncionario" className="text-sm font-semibold">
              Nome do Funcionário
            </label>
            <input
              type="text"
              className="border border-gray-300 rounded-md text-sm w-full text-center"
              value={nome}
              readOnly
            />
          </div>

          {/* QR Code */}
          <div className="flex justify-center items-center">
            <QrCodeGenerator cpf={cpf} />
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
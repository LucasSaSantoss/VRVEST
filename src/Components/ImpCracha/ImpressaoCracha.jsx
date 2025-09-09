import logoRio from "../../assets/LogoRio.png";
import QrCodeGenerator from "../GeradorQRCode/GeradorQrCodes";

export default function ImpressaoCracha({ cpf, nome }) {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-5 text-center text-white">
        Impressão de Crachá
      </h2>
      <div className="flex justify-center h-[65vh]">
        <section
          className="flex border-4 border-gray-300 rounded-lg p-1 w-100 h-150 flex flex-col 
          bg-white shadow-lg"
        >
          <div className=" flex ">
            <div className="flex-col w-1/2 h-1/2 flex items-start justify-start p-2 gap-2 break-normal">
              <label htmlFor="cpfFuncionario" className="w-full h-10">
                CPF
              </label>
              <input
                type="text"
                className="flex border border-gray-300 rounded-md p-2 w-full"
                value={cpf}
                readOnly
              />
            </div>
            <div className="flex-col w-1/2 h-1/2 flex items-start justify-start p-2 gap-2 break-normal">
              <label htmlFor="nomeFuncionario" className="w-full h-10">
                Nome do Funcionário
              </label>
              <input
                type="text"
                className="flex border border-gray-300 rounded-md p-2 w-full break-normal"
                value={nome}
                readOnly
              />
            </div>
          </div>

          <section className="flex  justify-center items-center h-[60%]">
            <QrCodeGenerator cpf={cpf} />
          </section>

          <div className="flex  justify-center ">
            <img
              className="w-[200px] h-[20vh] object-contain"
              src={logoRio}
              alt="Logo Rio"
            />
          </div>
          
        </section>
      </div>
    </div>
  );
}

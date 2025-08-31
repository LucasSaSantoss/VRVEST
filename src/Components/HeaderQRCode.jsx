function HeaderQRCode() {
  return (
    <div className="flex flex-col">
      <div className="flex items-center ml-8">
        <span className="flex justify-center items-center border-2 rounded-2xl text-4xl px-1 py-0.5 font-bold h-18 w-20">
          VR
        </span>
        <p className="flex text-7xl pl-2">VEST</p>
        <img
          className="imgViva h-[15vh] "
          src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
          alt="Logo Viva-Rio"
        />
      </div>
      <div className="text-left mt-5 ml-8">
        <h1 className="text-4xl font-bold text-gray-800">
          Sistema de Gestão de Vestes
        </h1>
        <p className="text-lg text-gray-600 mt-2">VERSÃO DE LANÇAMENTO</p>
      </div>
    </div>
  );
}

export default HeaderQRCode;

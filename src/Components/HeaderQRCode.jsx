function HeaderQRCode() {
  return (
    <div className="flex flex-row justify-between fixed top-0 left-0 w-full  z-50 shadow-md h-[25vh] items-center"
    style={{ backgroundColor: "rgb(23, 110, 150)" }}>
      <section>
        <div className="flex items-center ml-8">
          <span className="flex text-white justify-center items-center border-2 rounded-2xl text-4xl px-1 py-0.5 font-bold h-18 w-20">
            VR
          </span>
          <p className="flex text-white text-7xl pl-2">VEST</p>
          <img
            className="imgViva h-[15vh] "
            src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
            alt="Logo Viva-Rio"
          />
        </div>
        <div className="text-left mt-5 ml-8">
          <h1 className="text-4xl font-bold text-white">
            Sistema de Gestão de Vestes
          </h1>
          {/* <p className="text-lg text-white mt-2">VERSÃO DE LANÇAMENTO</p> */}
        </div>
      </section>
      <img
        className="w-[23vw] h-[20vh] mr-10 mt-4"
        src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
        alt="VR Vest Image"
      />
    </div>
  );
}

export default HeaderQRCode;

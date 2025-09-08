function HeaderQRCode() {
  return (
    <div className="flex flex-row justify-between fixed top-0 left-0 w-full z-40 shadow-md h-[28vh] items-center"
    style={{ backgroundColor: "rgb(23, 110, 150)" }}>
      <section>
        <div className="flex items-center ml-8">
          <p className="flex text-white text-7xl pl-2">e - VESTURÁRIO</p>
          
        </div>
        <div className="text-left mt-5 ml-8">
          <h1 className="text-4xl font-bold text-white">
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p className="text-lg text-white mt-2">VERSÃO DE LANÇAMENTO</p>
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

function HeaderQRCode() {
  return (
    <div className="flex flex-row rounded-xl fixed top-0 left-0 w-full z-40 shadow-md h-[21vh] items-center bg-[rgb(23,110,150)]">
      <img
        className="w-[20vw] h-[15vh] mr-10 mt-2"
        src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
        alt="VR Vest Image"
      />
      <section>
        <div className="flex items-center ml-[6vw]">
          <p className="flex text-white text-6xl pl-2">e-Vestuário</p>
        </div>

        <div className="text-left mt-5 ml-[6.5vw]">
          <h1 className="text-3xl font-bold text-white">
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p className="text-2xl text-white mt-2">VERSÃO DE LANÇAMENTO</p>
        </div>
      </section>
    </div>
  );
}

export default HeaderQRCode;

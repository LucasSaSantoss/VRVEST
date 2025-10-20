function HeaderQRCode() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between fixed top-0 left-0 w-full z-40 bg-[#16607a] shadow-md h-auto md:h-[18vh] p-4 md:p-6">
      {/* Logo */}
      <img
        className="w-40 md:w-[18vw] h-auto max-h-[15vh] md:mr-10"
        src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
        alt="VR Vest Image"
      />

      {/* Título e subtítulo */}
      <section className="flex flex-col text-center md:text-left items-center md:items-start flex-1">
        <div className="flex justify-center md:justify-start items-center mb-2">
          <p className="text-white text-4xl md:text-5xl font-semibold tracking-wide">
            e-Vestuário
          </p>
        </div>

        <div>
          <h1 className="text-2xl md:text-2xl font-bold text-white">
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p className="text-lg md:text-1xl text-white mt-1 md:mt-2">
            VERSÃO DE LANÇAMENTO
          </p>
        </div>
      </section>
    </header>
  );
}

export default HeaderQRCode;

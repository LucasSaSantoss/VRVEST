function HeaderQRCode() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between fixed top-0 left-0 w-full z-40 bg-[#16607a] shadow-md h-auto md:h-[18vh] md:p-5">
      {/* Logo */}
      <img
        className="md:w-[12%] max-h-[70%] md:mr-10"
        src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
        alt="VR Vest Image"
      />

      {/* Título e subtítulo */}
      <section className="flex flex-col text-center md:text-left items-center md:items-start flex-1">
        <div className="flex justify-center md:justify-start items-center mb-1">
          <p className="text-white text-4xl md:text-5xl font-semibold tracking-wide">
            e-Vestuário
          </p>
        </div>

        <div>
          <h1 className="text-2xl md:text-2xl font-bold text-white">
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p className="text-lg md:text-1xl text-white ">
            VERSÃO DE LANÇAMENTO
          </p>
        </div>
      </section>
    </header>
  );
}

export default HeaderQRCode;

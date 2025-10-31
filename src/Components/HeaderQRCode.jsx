function HeaderQRCode() {
  return (
    <header
      className="
        fixed top-0 left-0 w-full z-40
        bg-[#16607a] shadow-md
        flex flex-col sm:flex-row items-center justify-between
        px-4 sm:px-6 md:px-10
        py-2 sm:py-3 md:py-3
      "
    >
      {/* Logo */}
      <div className="flex justify-center sm:justify-start items-center w-full sm:w-auto">
        <img
          className="
            w-24 sm:w-28 md:w-32 lg:w-36
            max-h-[60px]
            mb-2 sm:mb-0
            object-contain
          "
          src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
          alt="VR Vest Image"
        />
      </div>

      {/* Título e subtítulo */}
      <section
        className="
          flex flex-col items-center sm:items-start
          text-center sm:text-left
          mt-1 sm:mt-0
          w-full sm:flex-1 ml-[2rem]
        "
      >
        <p
          className="
            text-white font-semibold tracking-wide leading-tight
            text-xl sm:text-2xl md:text-3xl
          "
        >
          e-Vestuário
        </p>

        <div className="space-y-0">
          <h1
            className="
              text-white font-medium leading-snug
              text-sm sm:text-base md:text-lg
            "
          >
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p
            className="
              text-white opacity-90
              text-[10px] sm:text-xs md:text-sm
            "
          >
            VERSÃO DE LANÇAMENTO
          </p>
        </div>
      </section>
    </header>
  );
}

export default HeaderQRCode;

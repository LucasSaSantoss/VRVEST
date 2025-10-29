
function HeaderQRCode() {
  return (
    <header className="flex flex-col md:flex-row items-center justify-between fixed top-0 left-0 w-full z-40 bg-[#16607a] shadow-md py-3 px-4 md:py-5 md:px-8">
      {/* Logo */}
      <img
        className="w-32 sm:w-40 md:w-[12%] max-h-[70%] mb-3 md:mb-0 md:mr-10 object-contain"
        src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
        alt="VR Vest Image"
      />

      {/* Título e subtítulo */}
      <section className="flex flex-col text-center md:text-left items-center md:items-start flex-1">
        <div className="flex justify-center md:justify-start items-center mb-1">
          <p className="text-white text-2xl sm:text-3xl md:text-5xl font-semibold tracking-wide leading-tight">
            e-Vestuário
          </p>
        </div>

        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white leading-snug">
            Sistema de Gerenciamento de Vestuário
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-white">
            VERSÃO DE LANÇAMENTO
          </p>
        </div>
      </section>
    </header>
  );
}

export default HeaderQRCode;
function ModalSelecaoKitTrauma({ mostrar, onEscolher, onClose }) {
  if (!mostrar) return null;
  if (onClose) {
    onClose();
  }
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-96">
        {/* Título */}
        <h2 className="text-xl font-bold mb-6 text-center text-gray-800">
          Escolha o tipo de KIT
        </h2>

        {/* Botões */}
        <div className="grid grid-cols-2 gap-6 justify-items-center">
          {/* KIT COMUM */}
          <div className="flex flex-col items-center">
            <button
              className="bg-green-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-green-600 shadow-md w-32 text-center"
              onClick={() => onEscolher("COMUM")}
            >
              KIT COMUM
            </button>
            <p className="mt-2 text-gray-700 font-semibold text-lg">1</p>
          </div>

          {/* KIT TRAUMA */}
          <div className="flex flex-col items-center">
            <button
              className="bg-blue-800 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 shadow-md w-32 text-center"
              onClick={() => onEscolher("TRAUMA")}
            >
              KIT TRAUMA
            </button>
            <p className="mt-2 text-gray-700 font-semibold text-lg">2</p>
          </div>
        </div>
      </div>
    </div>
  );
  8;
}

export default ModalSelecaoKitTrauma;

import { useState } from "react";

export default function ModalSimNao({
  mostrar,
  onConfirmar,
  onCancelar,
  isProcessing,
  mensagem,
}) {
  if (!mostrar) return null; // não renderiza nada se não for para mostrar

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-80">
        <h2 className="text-xl font-bold mb-4 text-center">
          {mensagem ? mensagem : "Deseja finalizar a operação?"}
        </h2>
        <div className="flex justify-between mt-4">
          <button
            onClick={onConfirmar}
            disabled={isProcessing}
            className={`px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${
              isProcessing
                ? "bg-gray-400 items-center justify-center cursor-not-allowed w-full"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            {isProcessing ? "Processando..." : "Sim"}
          </button>
          <button
            onClick={onCancelar}
            disabled={isProcessing}
            className={` ${
              isProcessing
                ? ""
                : "px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
            }`}
          >
            {isProcessing ? "" : "Não"}
          </button>
        </div>
      </div>
    </div>
  );
}

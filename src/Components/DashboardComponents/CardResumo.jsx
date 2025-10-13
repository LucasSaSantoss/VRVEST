export default function CardResumo({ titulo, valor, cor, ativo, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-4 text-white shadow-md transition-transform transform hover:scale-105
        ${cor} ${ativo ? "ring-4 ring-blue-300 scale-105" : ""}`}
    >
      <h3 className="text-sm font-semibold uppercase">{titulo}</h3>
      <p className="text-3xl font-bold mt-2">{valor}</p>
    </button>
  );
}
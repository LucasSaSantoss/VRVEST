export default function CardResumo({ titulo, valor, cor }) {
  return (
    <div className={`rounded-xl p-4 text-white shadow-md ${cor}`}>
      <h3 className="text-sm font-semibold uppercase">{titulo}</h3>
      <p className="text-3xl font-bold mt-2">{valor}</p>
    </div>
  );
}
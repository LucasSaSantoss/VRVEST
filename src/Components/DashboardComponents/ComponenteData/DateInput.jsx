import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { ptBR } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function FiltroDatas({
  inicio,
  fim,
  setInicio,
  setFim,
  onBuscar,
}) {
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const calendarioRef = useRef(null);

  // Fecha o calendário ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (calendarioRef.current && !calendarioRef.current.contains(e.target)) {
        setMostrarCalendario(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative flex flex-col items-center mb-4">
      <label className="text-sm font-semibold mb-2">Período</label>

      {/* Campo retrátil */}
      <button
        onClick={() => setMostrarCalendario(!mostrarCalendario)}
        className="flex items-center justify-center gap-2 border border-gray-300 rounded px-4 py-2 bg-white shadow-sm hover:bg-gray-50 transition text-sm"
      >
        <span className="text-gray-600">
          {inicio && fim
            ? `${new Date(inicio).toLocaleDateString()} - ${new Date(fim).toLocaleDateString()}`
            : "Selecionar período"}
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-blue-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10m-11 8h12a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      </button>

      {/* Calendário */}
      {mostrarCalendario && (
        <div
          ref={calendarioRef}
          className="absolute top-[100%] mt-2 bg-white border rounded-lg shadow-lg z-50 p-2"
        >
          <DateRange
            ranges={[
              {
                startDate: inicio ? new Date(inicio) : new Date(),
                endDate: fim ? new Date(fim) : "",
                key: "selection",
              },
            ]}
            onChange={(ranges) => {
              setInicio(ranges.selection.startDate.toISOString().slice(0, 10));
              setFim(ranges.selection.endDate.toISOString().slice(0, 10));
            }}
            locale={ptBR}
            showDateDisplay={false}
            rangeColors={["#3b82f6"]}
            moveRangeOnFirstSelection={false}
            months={1}
            direction="horizontal"
          />
          <div className="flex justify-end mt-2">
            <button
              className="bg-blue-500 text-white py-1 px-3 rounded hover:bg-blue-600"
              onClick={() => {
                onBuscar();
                setMostrarCalendario(false);
              }}
            >
              Aplicar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

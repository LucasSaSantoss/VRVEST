import { useState, useRef, useEffect } from "react";
import { DateRange } from "react-date-range";
import { ptBR } from "date-fns/locale";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

export default function FiltroDatas({ inicio, fim, setInicio, setFim }) {
  const [mostrarCalendario, setMostrarCalendario] = useState(false);
  const refCalendario = useRef(null);

  // Fecha o calendário ao clicar fora
  useEffect(() => {
    const handleClickFora = (event) => {
      if (
        refCalendario.current &&
        !refCalendario.current.contains(event.target)
      ) {
        setMostrarCalendario(false);
      }
    };
    document.addEventListener("mousedown", handleClickFora);
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, []);
  const ajustarDataInicial = (data) => {
    if (!data) return null; // se não houver data, retorna null
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    // Verifica se a data é válida
    if (isNaN(d.getTime())) {
      console.warn("Data inicial inválida:", data);
      return null;
    }
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const ajustarDataFinal = (data) => {
    if (!data) return null; // se não houver data, retorna null
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    // Verifica se a data é válida
    if (isNaN(d.getTime())) {
      console.warn("Data final inválida:", data);
      return null;
    }
    d.setHours(23, 59, 59, 999);
    return d;
  };
  // Estado temporário para seleção
  const [intervaloTemp, setIntervaloTemp] = useState([
    {
      startDate: inicio ? new Date(inicio) : new Date(),
      endDate: fim ? new Date(fim) : new Date(),
      key: "selection",
    },
    ,
    [inicio, fim],
  ]);
  // Atualiza intervaloTemp quando inicio/fim mudam externamente
  useEffect(() => {
    setIntervaloTemp([
      {
        startDate: inicio ? ajustarDataInicial(inicio) : new Date(),
        endDate: fim ? ajustarDataFinal(fim) : new Date(),
        key: "selection",
      },
    ]);
  }, [inicio, fim]);

  // Função para ajustar fuso horário e manter dia correto
  const formatarDataLocal = (date) => {
    const dataLocal = new Date(
      date.getTime() - date.getTimezoneOffset() * 60000
    );
    return dataLocal.toISOString().slice(0, 10);
  };

  // Confirma a seleção
  const confirmar = () => {
    const novaData = intervaloTemp[0];
    setInicio(formatarDataLocal(novaData.startDate));
    setFim(formatarDataLocal(novaData.endDate));
    setMostrarCalendario(false);
  };

  const textoBotao =
    inicio && fim
      ? `${inicio.split("-").reverse().join("/")}  ${fim.split("-").reverse().join("/")}`
      : "Selecione um intervalo";

  return (
    <div className="relative inline-block text-left" ref={refCalendario}>
      <button
        onClick={() => setMostrarCalendario(!mostrarCalendario)}
        className="border border-gray-300 rounded-lg px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2 shadow-sm transition-all"
      >
        <span>{textoBotao}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {mostrarCalendario && (
        <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-3">
          <DateRange
            editableDateInputs={true}
            onChange={(item) => {
              setIntervaloTemp([item.selection]);
            }}
            moveRangeOnFirstSelection={false}
            ranges={intervaloTemp}
            locale={ptBR}
            rangeColors={["#3b82f6"]}
          />
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={() => setMostrarCalendario(false)}
              className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancelar
            </button>
            <button
              onClick={confirmar}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

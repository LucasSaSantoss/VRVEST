import { useEffect, useMemo, useRef, useState } from "react";
import { LuChevronDown, LuSearch, LuX } from "react-icons/lu";

const normalizarTexto = (value) =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = "Selecione",
  searchPlaceholder = "Buscar...",
  disabled = false,
  className = "",
}) {
  const containerRef = useRef(null);
  const searchRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selectedOption = useMemo(
    () => options.find((option) => String(option.value) === String(value)),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizarTexto(query);
    if (!normalizedQuery) return options;
    return options.filter((option) =>
      normalizarTexto(option.label).includes(normalizedQuery)
    );
  }, [options, query]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 0);
    }
  }, [open]);

  const handleSelect = (optionValue) => {
    onChange?.(String(optionValue));
    setOpen(false);
    setQuery("");
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 rounded border bg-white px-3 py-2 text-left disabled:bg-gray-100 disabled:text-gray-400"
      >
        <span className="truncate">{selectedOption?.label || placeholder}</span>
        <LuChevronDown className={`shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 right-0 z-[90] mt-1 rounded-lg border bg-white p-2 shadow-xl">
          <div className="relative mb-2">
            <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded border py-2 pl-9 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                aria-label="Limpar busca"
              >
                <LuX />
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto">
            {value && (
              <button
                type="button"
                onClick={() => handleSelect("")}
                className="w-full rounded px-3 py-2 text-left text-sm text-gray-500 hover:bg-gray-100"
              >
                Limpar seleção
              </button>
            )}

            {filteredOptions.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500">Nenhum item encontrado.</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full rounded px-3 py-2 text-left text-sm hover:bg-blue-50 ${
                    String(option.value) === String(value)
                      ? "bg-blue-100 font-semibold text-blue-800"
                      : "text-gray-800"
                  }`}
                >
                  {option.label}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

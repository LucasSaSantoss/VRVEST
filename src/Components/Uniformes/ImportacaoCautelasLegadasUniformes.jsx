import { useState } from "react";
import * as XLSX from "xlsx";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };
const IMPORT_CHUNK_SIZE = 400;

const asCellString = (value) => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toLocaleDateString("pt-BR");
  return String(value).trim();
};

const findHeaderIndex = (rows) => {
  const limit = Math.min(rows.length, 20);
  for (let index = 0; index < limit; index += 1) {
    const row = rows[index] || [];
    const normalized = row.map((cell) => asCellString(cell).toUpperCase());
    if (
      normalized.some((cell) => cell.includes("NOME")) &&
      normalized.some((cell) => cell.includes("CPF")) &&
      normalized.some((cell) => cell.includes("DATA"))
    ) {
      return index;
    }
  }
  return 0;
};

const parseWorksheetRows = (worksheetRows) => {
  const headerIndex = findHeaderIndex(worksheetRows);
  return worksheetRows
    .slice(headerIndex + 1)
    .map((row, index) => ({
      rowNumber: headerIndex + index + 2,
      matricula: asCellString(row?.[0]),
      nome: asCellString(row?.[1]),
      cpf: asCellString(row?.[5]),
      data: asCellString(row?.[6]),
    }))
    .filter((row) => row.matricula || row.nome || row.cpf || row.data);
};

const exportJsonToExcel = (rows, sheetName, fileName) => {
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, fileName);
};

const mergeImportResults = (current, next) => ({
  success: true,
  message: next?.message || current?.message || "Importação processada.",
  summary: {
    recebidos:
      Number(current?.summary?.recebidos || 0) + Number(next?.summary?.recebidos || 0),
    criados:
      Number(current?.summary?.criados || 0) + Number(next?.summary?.criados || 0),
    atualizados:
      Number(current?.summary?.atualizados || 0) + Number(next?.summary?.atualizados || 0),
    semAlteracao:
      Number(current?.summary?.semAlteracao || 0) +
      Number(next?.summary?.semAlteracao || 0),
    rejeitados:
      Number(current?.summary?.rejeitados || 0) + Number(next?.summary?.rejeitados || 0),
  },
  rejeitados: [...(current?.rejeitados || []), ...(next?.rejeitados || [])],
  resultado: [...(current?.resultado || []), ...(next?.resultado || [])],
});

export default function ImportacaoCautelasLegadasUniformes() {
  const [loading, setLoading] = useState(false);
  const [parsedRows, setParsedRows] = useState([]);
  const [importResult, setImportResult] = useState(null);
  const [importProgress, setImportProgress] = useState({ loteAtual: 0, totalLotes: 0 });
  const [popup, setPopup] = useState(INITIAL_POPUP);

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    setImportResult(null);
    setParsedRows([]);
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, {
        type: "array",
        cellDates: true,
      });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json(sheet, {
        header: 1,
        defval: "",
        raw: false,
      });
      const parsed = parseWorksheetRows(rows);
      setParsedRows(parsed);
      showTemporaryPopup(`${parsed.length} linhas lidas da planilha.`, "success");
    } catch (error) {
      console.error("Erro ao ler planilha de cautelas históricas:", error);
      showTemporaryPopup("Erro ao ler a planilha enviada.", "error");
    }
  };

  const handleImport = async () => {
    if (!parsedRows.length) {
      showTemporaryPopup("Selecione uma planilha válida antes de importar.", "error");
      return;
    }

    setLoading(true);
    setImportProgress({ loteAtual: 0, totalLotes: Math.ceil(parsedRows.length / IMPORT_CHUNK_SIZE) });
    try {
      // [MANUTENCAO] Motivo: evitar HTTP 413 ao importar planilhas grandes convertidas em JSON.
      // [MANUTENCAO] Impacto: mantém a mesma rota e consolida o retorno dos lotes para o usuário.
      // [MANUTENCAO] Data: 2026-06-08
      // [MANUTENCAO] Autor: Márlon Etiene
      let consolidatedResult = null;
      const totalChunks = Math.ceil(parsedRows.length / IMPORT_CHUNK_SIZE);

      for (let start = 0; start < parsedRows.length; start += IMPORT_CHUNK_SIZE) {
        const chunk = parsedRows.slice(start, start + IMPORT_CHUNK_SIZE);
        const chunkNumber = Math.floor(start / IMPORT_CHUNK_SIZE) + 1;
        setImportProgress({ loteAtual: chunkNumber, totalLotes: totalChunks });

        const res = await api.post("/uniforms/legacy-baselines/import", {
          rows: chunk,
        });

        if (res.data?.success) {
          consolidatedResult = mergeImportResults(consolidatedResult, res.data);
        }
      }

      setImportResult(consolidatedResult);
      showTemporaryPopup("Importação processada.", "success");
    } catch (error) {
      showTemporaryPopup(
        obterMensagemErroApi(error, "Erro ao importar cautelas históricas."),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const exportarRejeitos = () => {
    const rejeitados = importResult?.rejeitados || [];
    if (!rejeitados.length) {
      showTemporaryPopup("Não há registros rejeitados para exportar.", "error");
      return;
    }
    exportJsonToExcel(
      rejeitados,
      "Registros Rejeitados",
      `rejeitos_cautelas_historicas_${new Date().toISOString().slice(0, 10)}.xlsx`
    );
  };

  return (
    <section className="border border-gray-200 rounded-lg p-4 max-w-4xl relative">
      <h2 className="text-lg font-semibold text-gray-800 mb-1">
        Importação de Cautelas Históricas
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Área restrita para importar a última cautela informada pela rouparia.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Arquivo Excel
          </label>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="border rounded px-3 py-2 w-full"
            onChange={handleFileChange}
            disabled={loading}
          />
        </div>
        <button
          type="button"
          onClick={handleImport}
          disabled={loading || parsedRows.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded"
        >
          {loading ? "Importando..." : "Importar cautelas"}
        </button>
        <button
          type="button"
          onClick={exportarRejeitos}
          disabled={!importResult?.rejeitados?.length || loading}
          className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 text-white font-semibold px-4 py-2 rounded"
        >
          Registros rejeitados
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
        <div className="border rounded p-2">
          <strong>Lidas:</strong> {parsedRows.length}
        </div>
        <div className="border rounded p-2">
          <strong>Criadas:</strong> {importResult?.summary?.criados || 0}
        </div>
        <div className="border rounded p-2">
          <strong>Atualizadas:</strong> {importResult?.summary?.atualizados || 0}
        </div>
        <div className="border rounded p-2">
          <strong>Sem alteração:</strong> {importResult?.summary?.semAlteracao || 0}
        </div>
        <div className="border rounded p-2">
          <strong>Rejeitadas:</strong> {importResult?.summary?.rejeitados || 0}
        </div>
      </div>

      {loading && (
        <div className="fixed inset-0 z-[90] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center border border-blue-100">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
            <h3 className="text-lg font-bold text-gray-800">Importação em andamento</h3>
            <p className="text-sm text-gray-600 mt-2">
              Aguarde a finalização. Não feche a tela nem atualize o navegador.
            </p>
            <div className="mt-4 bg-gray-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{
                  width: `${importProgress.totalLotes ? (importProgress.loteAtual / importProgress.totalLotes) * 100 : 0}%`,
                }}
              />
            </div>
            <p className="text-sm font-semibold text-gray-700 mt-3">
              Lote {importProgress.loteAtual || 1} de {importProgress.totalLotes || 1}
            </p>
          </div>
        </div>
      )}

      {popup.show && (
        <div
          className={`fixed top-5 right-5 z-[100] px-4 py-2 rounded shadow text-white ${
            popup.type === "success"
              ? "bg-green-600"
              : popup.type === "info"
                ? "bg-blue-600"
                : "bg-red-600"
          }`}
        >
          {popup.message}
        </div>
      )}
    </section>
  );
}

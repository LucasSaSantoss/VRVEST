import { useState } from "react";
import readXlsxFile from "read-excel-file";
import axios from "axios";
import { importarFuncionarios } from "../../services/api";

export default function ImportFunc() {
  const [dados, setDados] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const rows = await readXlsxFile(file);
    const headers = [
      "Nome",
      "cpf",
      "Email",
      "Setor",
      "Cargo",
      "Modalidade",
      "Matrícula",
    ];
    const data = rows
      .slice(1)
      .map((row) => Object.fromEntries(headers.map((h, i) => [h, row[i]])));
    console.log(headers);
    setDados(data);
  };

  const handleImportar = async () => {
    setCarregando(true);
    try {
      const response = await importarFuncionarios(dados);

      if (response.success) {
        setMensagem(response.message);

        // Se existirem registros ignorados, gera o arquivo .txt
        if (response.ignorados && response.ignorados.length > 0) {
          const linhas = response.ignorados.map(
            (f) => `CPF: ${f.cpf} | Motivo: ${f.motivo}`
          );
          const conteudo = linhas.join("\n");
          const blob = new Blob([conteudo], { type: "text/plain" });
          const link = document.createElement("a");
          const dataHora = new Date().toISOString().replace(/[:.]/g, "-");
          link.href = URL.createObjectURL(blob);
          link.download = `ignorados_${dataHora}.txt`;
          link.click();
        }
      } else {
        setMensagem(response.message || "Erro ao importar colaboradores.");
      }
    } catch (error) {
      console.error(error);
      setMensagem("Erro ao enviar os dados para o servidor.");
    } finally {
      setCarregando(false);
    }
  };
  return (
    <div className="flex flex-col gap-4 text-gray-700">
      <h2 className="text-lg font-semibold">
        Importar Colaboradores via Planilha
      </h2>

      <input
        type="file"
        accept=".xlsx, .xls"
        onChange={handleFileUpload}
        className="border p-2 rounded-md"
      />

      {dados.length > 0 && (
        <div className="max-h-60 overflow-y-auto border rounded-md p-2 text-sm bg-gray-50">
          <table className="w-full border-collapse border">
            <thead>
              <tr className="bg-gray-200">
                {Object.keys(dados[0]).map((coluna) => (
                  <th key={coluna} className="border p-1">
                    {coluna}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dados.slice(0, 5).map((linha, i) => (
                <tr key={i}>
                  {Object.values(linha).map((valor, j) => (
                    <td key={j} className="border p-1 text-center">
                      {valor}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs mt-1 text-gray-500">
            Mostrando as 5 primeiras linhas da planilha.
          </p>
        </div>
      )}

      <button
        onClick={handleImportar}
        disabled={carregando}
        className="bg-green-600 text-white rounded-md py-2 hover:bg-green-700 transition disabled:opacity-50"
      >
        {carregando ? "Importando..." : "Enviar para o Banco"}
      </button>

      {mensagem && <p className="text-center font-medium mt-2">{mensagem}</p>}
    </div>
  );
}

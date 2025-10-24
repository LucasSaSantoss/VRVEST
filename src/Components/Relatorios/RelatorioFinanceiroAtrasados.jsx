import { useState, useEffect } from "react";
import { carregarPendencias } from "../../services/api";
import FiltroDatas from "../DashboardComponents/ComponenteData/DateInput";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { differenceInMinutes } from "date-fns";
import React from "react";

export default function RelatoriosPendencias() {
  // -------------------- Estados ---------------------------
  const [pendencias, setPendencias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroPorBaixa, setFiltroPorBaixa] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [regPorPagina, setRegPorPagina] = useState(10);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [loading, setLoading] = useState(false);

  // -------------------- Carregar dados ---------------------------
  const listarPendencias = async () => {
    setLoading(true);
    try {
      const dados = await carregarPendencias(
        ajustarDataInicial(inicio),
        ajustarDataFinal(fim)
      );
      if (dados?.success) setPendencias(dados.data);
      else console.error(dados.message);
    } catch (err) {
      console.error("Erro ao carregar pendências:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    listarPendencias();
  }, [inicio, fim]);

  // -------------------- Filtros ---------------------------
  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

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

  const definirStatus = (item) => {
    const minutos = differenceInMinutes(dataBR, new Date(item.date));
    if (item.status === 1) {
      if (minutos <= 36 * 60) return "Em aberto";
      return "Atrasado";
    }

    if (item.status === 2) {
      return "Devolvido";
    }
    return "Desconhecido";
  };

  const getStatusCor = (status) => {
    switch (status) {
      case "Em aberto":
        return "text-blue-600 ";
      case "Atrasado":
        return "text-red-600 ";
      case "Devolvido":
        return "text-green-600 ";
      default:
        return "text-gray-600 ";
    }
  };
  const filtroTextoSeguro =
    typeof filtro === "string" ? filtro.toLowerCase() : "";

  const pendenciasFiltradas = pendencias.filter((p) => {
    const nome = p.emplName?.toLowerCase() || "";
    const cpf =
      p.emplCpf?.toLowerCase() || p.employee?.cpf?.toLowerCase() || "";

    const passaFiltroTexto =
      nome.includes(filtroTextoSeguro) || cpf.includes(filtroTextoSeguro);

    const passaFiltroStatus =
      filtroPorBaixa === "" || definirStatus(p) === filtroPorBaixa;
    return passaFiltroTexto && passaFiltroStatus;
  });

  // -------------------- Estatísticas ---------------------------
  const pendAbertas = pendencias.filter(
    (p) => definirStatus(p) === "Em aberto"
  ).length;
  const pendBaixadas = pendencias.filter(
    (p) => definirStatus(p) === "Devolvido"
  ).length;
  const pendAtrasadas = pendencias.filter(
    (p) => definirStatus(p) === "Atrasado"
  ).length;

  // -------------------- Paginação ---------------------------
  const totalPaginas = Math.max(
    1,
    Math.ceil(pendenciasFiltradas.length / regPorPagina)
  );
  const indiceUltimoRegistro = paginaAtual * regPorPagina;
  const indicePrimeiroRegistro = indiceUltimoRegistro - regPorPagina;
  const registrosFiltrados = pendenciasFiltradas.slice(
    indicePrimeiroRegistro,
    indiceUltimoRegistro
  );

  // -------------------- Exportação PDF / Excel ---------------------------
  const gerarPDF = () => {
    const doc = new jsPDF();
    doc.text("Relatório de Pendências", 14, 15);
    doc.autoTable({
      startY: 25,
      head: [["Colaborador", "Status", "Data"]],
      body: pendenciasFiltradas.map((p) => [
        p.emplName,
        definirStatus(p),
        ajustarDataInicial(p.date),
      ]),
    });
    doc.save("relatorio_pendencias.pdf");
  };

  const gerarExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      pendenciasFiltradas.map((p) => ({
        Funcionário: p.emplName,
        status: definirStatus(p),
        Data: ajustarDataInicial(p.date),
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendências");
    XLSX.writeFile(wb, "relatorio_pendencias.xlsx");
  };

  const pendenciasAgrupadas = registrosFiltrados.reduce((acc, p) => {
    if (!acc[p.emplName]) acc[p.emplName] = [];
    acc[p.emplName].push(p);
    return acc;
  }, {});

  return (
    <div className="p-5 mt-5 min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-[#16607a] mb-6">
        Relatórios de Pendências
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-start w-full flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <label>Registros por página:</label>
            <select
              value={regPorPagina}
              onChange={(e) => {
                setRegPorPagina(Number(e.target.value));
                setPaginaAtual(1);
              }}
              className="border rounded p-1"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label>Status:</label>
            <select
              value={filtroPorBaixa}
              onChange={(e) => {
                setFiltroPorBaixa(e.target.value);
                setPaginaAtual(1);
              }}
              className="border rounded p-1"
            >
              <option value={""}>Todas</option>
              <option value={"Em aberto"}>Em aberto</option>
              <option value={"Devolvido"}>Devolvido</option>
              <option value={"Atrasado"}>Atrasado</option>
            </select>
          </div>

          <input
            type="text"
            placeholder="Filtrar por nome ou CPF"
            value={filtro}
            onChange={(e) => {
              setFiltro(e.target.value);
              setPaginaAtual(1);
            }}
            className="border bg-white w-[30vw] border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <FiltroDatas
            inicio={inicio}
            fim={fim}
            setInicio={setInicio}
            setFim={setFim}
          />
        </div>
      </div>

      {/* Cards resumo */}
      <div className="grid grid-cols-[20rem_20rem_20rem] gap-4 mb-2 justify-center">
        <div
          onClick={() => setFiltroPorBaixa("Em aberto")}
          className="cursor-pointer bg-blue-300 p-4 rounded-lg text-center shadow hover:bg-blue-400 transition"
          role="button"
          tabIndex={0}
        >
          <p className="text-2xl font-bold text-blue-800">{pendAbertas}</p>
          <p className="text-sm text-blue-700 font-medium">
            Pendências em aberto
          </p>
        </div>

        <div
          onClick={() => setFiltroPorBaixa("Devolvido")}
          className="cursor-pointer bg-green-300 p-4 rounded-lg text-center shadow hover:bg-green-400 transition"
          role="button"
          tabIndex={0}
        >
          <p className="text-2xl font-bold text-green-800">{pendBaixadas}</p>
          <p className="text-sm text-green-700 font-medium">
            Pendências devolvidas
          </p>
        </div>

        <div
          onClick={() => setFiltroPorBaixa("Atrasado")}
          className="cursor-pointer bg-red-300 p-4 rounded-lg text-center shadow hover:bg-red-400 transition"
          role="button"
          tabIndex={0}
        >
          <p className="text-2xl font-bold text-red-800">{pendAtrasadas}</p>
          <p className="text-sm text-red-700 font-medium">
            Pendências atrasadas
          </p>
        </div>
      </div>

      {/* Botões de exportação */}
      <div className="flex gap-3 justify-start mb-4">
        <button
          onClick={gerarPDF}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
        >
          Exportar PDF
        </button>
        <button
          onClick={gerarExcel}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Exportar Excel
        </button>
      </div>

      {/* Tabela */}
      <div className="bg-white p-4 rounded-lg shadow overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#16607a] text-white text-center">
              <th className="p-2">Colaborador</th>
              <th className="p-2">Status</th>
              <th className="p-2">Data de Retirada</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(pendenciasAgrupadas).map(([nome, lista]) => (
              <React.Fragment key={nome}>
                {/* Cabeçalho do funcionário */}
                <tr className="bg-blue-200 font-bold text-left">
                  <td colSpan={3} className="p-2 text-[#16607a]">
                    {nome}
                  </td>
                </tr>

                {/* Linhas de pendências do funcionário */}
                {lista.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 text-center">
                    <td className="p-2"></td>
                    <td className={`p-2 ${getStatusCor(definirStatus(p))}`}>
                      {definirStatus(p)}
                    </td>
                    <td className="p-2">
                      {new Date(p.date).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      <div className="flex justify-center mt-4 items-center gap-3">
        <button
          onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
          disabled={paginaAtual === 1}
          className="px-4 py-1 bg-[#36b0d4] rounded hover:bg-blue-500 disabled:opacity-50"
        >
          Anterior
        </button>
        <span>
          Página {paginaAtual} de {totalPaginas}
        </span>
        <button
          onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
          disabled={paginaAtual === totalPaginas}
          className="px-4 py-1 bg-[#36b0d4] rounded hover:bg-blue-500 disabled:opacity-50"
        >
          Próxima
        </button>
      </div>

      {loading && (
        <div className="text-center mt-6 text-gray-600 animate-pulse">
          Carregando...
        </div>
      )}
    </div>
  );
}

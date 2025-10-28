import { useState, useEffect } from "react";
import { carregarPendencias } from "../../services/api";
import FiltroDatas from "../DashboardComponents/ComponenteData/DateInput";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { differenceInMinutes } from "date-fns";
import React from "react";

export default function RelatoriosPendencias() {
  // -------------------- Estados ---------------------------
  const [pendencias, setPendencias] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [filtroPorBaixa, setFiltroPorBaixa] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [loading, setLoading] = useState(false);

  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1);

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
    setInicio(inicioMes.toISOString().split("T")[0]);
    setFim(dataBR.toISOString().split("T")[0]);
    listarPendencias(inicioMes, dataBR);
  }, []);

  useEffect(() => {
    if (inicio && fim) listarPendencias(inicio, fim);
  }, [inicio, fim]);

  // -------------------- Funções auxiliares ---------------------------

  const formatarDataHora = (dataISO) => {
    if (!dataISO) return "-";
    const data = new Date(dataISO);
    return data.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "medium", // inclui horas, minutos e segundos
    });
  };

  const handleSelecionarCard = (status) => {
    setFiltroPorBaixa((prev) => (prev === status ? "" : status));
  };

  const ajustarDataInicial = (data) => {
    if (!data) return null;
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    if (isNaN(d.getTime())) return null;
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const ajustarDataFinal = (data) => {
    if (!data) return null;
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    if (isNaN(d.getTime())) return null;
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const definirStatus = (item) => {
    const minutos = differenceInMinutes(dataBR, new Date(item.date));
    if (item.status === 1) {
      if (minutos <= 36 * 60) return "Em aberto";
      return "Atrasado";
    }
    if (item.status === 2) return "Devolvido";
    return "Desconhecido";
  };

  const getStatusCor = (status) => {
    switch (status) {
      case "Em aberto":
        return "text-blue-600 bg-blue-300";
      case "Atrasado":
        return "text-red-600 bg-red-200";
      case "Devolvido":
        return "text-green-600 bg-green-200";
      default:
        return "text-gray-600";
    }
  };

  // -------------------- Filtros ---------------------------
  const filtroTextoSeguro =
    typeof filtro === "string" ? filtro.toLowerCase().trim() : "";

  const pendenciasFiltradas = pendencias.filter((p) => {
    const nome = p.emplName?.toLowerCase() || "";
    const cpf = p.employee?.cpf?.toLowerCase() || "";

    const passaFiltroTexto =
      nome.includes(filtroTextoSeguro) || cpf.includes(filtroTextoSeguro);
    const passaFiltroStatus =
      filtroPorBaixa === "" || definirStatus(p) === filtroPorBaixa;

    return passaFiltroTexto && passaFiltroStatus;
  });

  // -------------------- Agrupamento ---------------------------
  const pendenciasAgrupadas = pendenciasFiltradas.reduce((acc, p) => {
    const nomeNormalizado = (p.emplName || "").trim().toLowerCase();
    if (!acc[nomeNormalizado])
      acc[nomeNormalizado] = { nome: p.emplName, lista: [] };
    acc[nomeNormalizado].lista.push(p);
    return acc;
  }, {});

  // -------------------- Estatísticas ---------------------------
  const pendAbertas = pendenciasFiltradas
    ? pendenciasFiltradas.filter((p) => definirStatus(p) === "Em aberto").length
    : pendencias.filter((p) => definirStatus(p) === "Em aberto").length;
  const pendBaixadas = pendenciasFiltradas
    ? pendenciasFiltradas.filter((p) => definirStatus(p) === "Devolvido").length
    : pendencias.filter((p) => definirStatus(p) === "Devolvido").length;
  const pendAtrasadas = pendenciasFiltradas
    ? pendenciasFiltradas.filter((p) => definirStatus(p) === "Atrasado").length
    : pendencias.filter((p) => definirStatus(p) === "Atrasado").length;

  // -------------------- Exportação PDF / Excel ---------------------------
  const gerarPDF = () => {
    let numPag = 1;
    const doc = new jsPDF("p", "mm", "a4");
    const margemEsq = 10;
    const margemTopo = 15;
    const larguraPagina = 200;

    // -------------------- Cabeçalho --------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Relatório de Pendências", margemEsq, margemTopo);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Período: ${inicio ? new Date(ajustarDataInicial(inicio)).toLocaleDateString("pt-BR") : "-"} a ${
        fim ? new Date(ajustarDataFinal(fim)).toLocaleDateString("pt-BR") : "-"
      }`,
      margemEsq,
      margemTopo + 8
    );

    doc.text(
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      margemEsq,
      margemTopo + 13
    );

    // Linha de separação
    doc.setLineWidth(0.5);
    doc.line(
      margemEsq,
      margemTopo + 17,
      margemEsq + larguraPagina,
      margemTopo + 17
    );

    let y = margemTopo + 25;

    // -------------------- Cabeçalho da tabela --------------------
    const colunas = [
      { titulo: "CPF", largura: 28 },
      { titulo: "Matrícula", largura: 40 },
      { titulo: "Kit Cirúrgico", largura: 25 },
      { titulo: "Data Retirada", largura: 37 },
      { titulo: "Data Baixa", largura: 37 },
      { titulo: "Status", largura: 25 },
    ];

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    let x = margemEsq;

    colunas.forEach((col) => {
      doc.text(col.titulo, x + 1, y);
      x += col.largura;
    });

    // Linha abaixo do cabeçalho
    y += 3;
    doc.line(margemEsq, y, margemEsq + larguraPagina, y);
    y += 4;

    // -------------------- Dados --------------------
    doc.setFont("helvetica", "normal");

    Object.values(pendenciasAgrupadas).forEach(({ nome, lista }) => {
      // Nome do colaborador (linha destacada)
      if (y > 270) {
        doc.addPage();
        y = margemTopo;
        numPag++;
      }
      doc.setFont("helvetica", "bold");
      doc.setTextColor(22, 96, 122); // azul escuro
      doc.text(nome || "Colaborador não identificado", margemEsq, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      y += 6;

      lista.forEach((p) => {
        if (y > 280) {
          doc.addPage();
          y = margemTopo;
          numPag++;
        }

        const linha = [
          p.employee?.cpf || "-",
          p.employee?.matricula || "-",
          p.kitSize || "-",
          formatarDataHora(p.date),
          formatarDataHora(p.devolDate),
          definirStatus(p),
        ];

        let x = margemEsq;
        linha.forEach((texto, i) => {
          doc.text(String(texto || "-"), x + 1, y);
          x += colunas[i].largura;
        });

        y += 6;
      });

      y += 2;
      doc.setDrawColor(180);
      doc.line(margemEsq, y, margemEsq + larguraPagina, y);
      y += 5;

      doc.text("Página " + numPag, 180, 290);
    });

    // -------------------- Rodapé --------------------
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text(
      `Total de pendências: ${pendenciasFiltradas.length}`,
      margemEsq,
      290
    );
    // doc.text(`Página 1`, 180, 290);

    // -------------------- Salvar --------------------
    doc.save("relatorio-pendencias.pdf");
  };

  const gerarExcel = () => {
    console.log(pendenciasAgrupadas);
    const linhas = Object.values(pendenciasAgrupadas).flatMap(
      ({ nome, lista }) =>
        lista.map((p) => ({
          Colaborador: nome,
          cpf: p.employee.cpf,
          Matricula: p.employee.matricula,
          Kit: p.kitSize,
          Data: formatarDataHora(p.date),
          DataDevol: formatarDataHora(p.devolDate),
          Status: definirStatus(p),
        }))
    );
    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pendências");
    XLSX.writeFile(wb, "relatorio_pendencias.xlsx");
  };

  // -------------------- Renderização ---------------------------
  return (
    <div className="p-5 mt-5 max-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-[#16607a] mb-6">
        Relatórios de Pendências
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex items-center justify-start w-full flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <label>Status:</label>
            <select
              value={filtroPorBaixa}
              onChange={(e) => setFiltroPorBaixa(e.target.value)}
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
            onChange={(e) => setFiltro(e.target.value)}
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
      <div className="grid grid-cols-[25rem_20rem_20rem_20rem] gap-4 mb-2 justify-start items-center">
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
        <div
          onClick={() => handleSelecionarCard("Em aberto")}
          className={`cursor-pointer bg-blue-300 p-4 rounded-lg text-center shadow hover:bg-blue-400 transition ${filtroPorBaixa === "Em aberto" ? "ring-4 ring-blue-300 scale-105" : ""}`}
        >
          <p className="text-2xl font-bold text-blue-800">{pendAbertas}</p>
          <p className="text-sm text-blue-700 font-medium">
            Pendências em aberto
          </p>
        </div>

        <div
          onClick={() => handleSelecionarCard("Devolvido")}
          className={`cursor-pointer bg-green-300 p-4 rounded-lg text-center shadow hover:bg-green-400 transition ${filtroPorBaixa === "Devolvido" ? "ring-4 ring-green-300 scale-105" : ""}`}
        >
          <p className="text-2xl font-bold text-green-800">{pendBaixadas}</p>
          <p className="text-sm text-green-700 font-medium">
            Pendências devolvidas
          </p>
        </div>

        <div
          onClick={() => handleSelecionarCard("Atrasado")}
          className={`cursor-pointer bg-red-300 p-4 rounded-lg text-center shadow hover:bg-red-400 transition ${filtroPorBaixa === "Atrasado" ? "ring-4 ring-red-300 scale-105" : ""}`}
        >
          <p className="text-2xl font-bold text-red-800">{pendAtrasadas}</p>
          <p className="text-sm text-red-700 font-medium">
            Pendências atrasadas
          </p>
        </div>
      </div>

      {/* Tabela com overflow */}
      <div className="bg-white  rounded-lg shadow overflow-y-auto max-h-[48vh]">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 bg-[#16607a] text-white">
            <tr className="text-center">
              <th className="p-2">CPF</th>
              <th className="p-2">Matrícula</th>
              <th className="p-2">Kit Cirúrgico</th>
              <th className="p-2">Data de Retirada</th>
              <th className="p-2">Data da Baixa</th>
              <th className="p-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {Object.values(pendenciasAgrupadas).map(({ nome, lista }) => (
              <React.Fragment key={nome}>
                <tr className="bg-blue-200 font-bold text-left">
                  <td colSpan={6} className="p-2 text-[#16607a]">
                    {nome}
                  </td>
                </tr>
                {lista.map((p, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50 text-center">
                    <td className="p-2">{p.employee.cpf}</td>
                    <td className="p-2">{p.employee.matricula}</td>
                    <td className="p-2">{p.kitSize}</td>
                    <td className="p-2">
                      {p.date ? formatarDataHora(p.date) : ""}
                    </td>
                    <td className="p-2">
                      {p.devolDate ? formatarDataHora(p.devolDate) : ""}
                    </td>
                    <td className={`p-2 ${getStatusCor(definirStatus(p))}`}>
                      {definirStatus(p)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {loading && (
        <div className="text-center mt-6 text-gray-600 animate-pulse">
          Carregando...
        </div>
      )}
    </div>
  );
}

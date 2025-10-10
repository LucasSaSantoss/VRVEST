// src/pages/Dashboard.jsx

import CardResumo from "./cardResumo";
// import GraficoMovimentacao from "./graficoMovimentacao";
import TabelaPendencias from "./tabelaPendencias";

export default function DashBoardVRVest() {
  const cards = [
    { titulo: "Retirados Hoje", valor: 23, cor: "bg-blue-500" },
    { titulo: "Pendentes", valor: 8, cor: "bg-yellow-500" },
    { titulo: "Atrasados", valor: 2, cor: "bg-red-500" },
    { titulo: "Devolvidos", valor: 18, cor: "bg-green-500" },
  ];

  const dadosSemanais = [
    { dia: "Seg", retiradas: 10, devolucoes: 8 },
    { dia: "Ter", retiradas: 15, devolucoes: 12 },
    { dia: "Qua", retiradas: 12, devolucoes: 14 },
    { dia: "Qui", retiradas: 20, devolucoes: 18 },
    { dia: "Sex", retiradas: 18, devolucoes: 19 },
  ];

  const pendencias = [
    {
      colaborador: "João Silva",
      kit: "Ortopedia",
      data: "09/10 08:22",
      status: "Pendente",
      tempo: "2h",
    },
    {
      colaborador: "Maria Lima",
      kit: "Cirurgia Geral",
      data: "08/10 17:40",
      status: "Atrasado",
      tempo: "20h",
    },
    {
      colaborador: "Carlos Souza",
      kit: "Urologia",
      data: "09/10 10:15",
      status: "Devolvido",
      tempo: "OK",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-2xl font-bold mb-6">
        Dashboard - Rouparia Hospitalar
      </h1>

      {/* Cards de resumo */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cards.map((card, i) => (
          <CardResumo key={i} {...card} />
        ))}
      </div>

      {/* Gráfico */}
      {/* <GraficoMovimentacao dados={dadosSemanais} /> */}

      {/* Tabela de pendências */}
      <TabelaPendencias pendencias={pendencias} />
    </div>
  );
}

import { useState, useEffect } from "react";
import CardResumo from "./CardResumo";
import TabelaPendencias from "./TabelaPendencias";
import GraficoDoughnut from "./GraficoDoughnut";
import { carregarPendencias } from "../../services/api";
import { differenceInMinutes } from "date-fns";

export default function Dashboard() {
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");

  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

  // -------------------   Define o status da Pendência  -------------------
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

  // ----------------- Formata o tempo em horas e minutos -----------------
  const formatarTempo = (minutos) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const restoMin = minutos % 60;
    return `${horas}h ${restoMin > 0 ? restoMin + "min" : ""}`;
  };

  // ------------------- Carrega as pendências -------------------

  const listarPendencias = async (inicio, fim) => {
    try {
      const dados = await carregarPendencias(inicio, fim);
      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          const minutos = differenceInMinutes(dataBR, new Date(item.date));
          return {
            colaborador: item.emplName,
            kit: item.employee.sector,
            data: new Date(item.date).toLocaleString("pt-BR"),
            status: definirStatus(item),
            tempo: formatarTempo(minutos),
          };
        });
        setPendencias(formatadas);
      } else {
        console.warn("Formato inesperado de dados:", dados);
      }
    } catch (err) {
      console.error("Erro ao carregar pendências:", err);
    }
  };

  // ----------------- Inicializa a tela com as Pendências -----------------

  useEffect(() => {
    listarPendencias(dataBR, dataBR);
    setInicio(dataBR.toISOString().split("T")[0]);
    setFim(dataBR.toISOString().split("T")[0]);
  }, []);

  // ----------------- Filtra as pendências para a tabela -----------------

  const statusPendencias = filtroStatus
    ? pendencias.filter((p) => p.status === filtroStatus)
    : pendencias;

  // ----------------- Seleciona o card do resumo -----------------
  const handleSelecionarCard = (status) => {
    setFiltroStatus((prev) => (prev === status ? null : status));
  };

  return (
    <div className="flex flex-col w-full">
      <div>
        <h1 className="text-2xl text-center font-bold mb-6">
          Dashboard da Rouparia
        </h1>
      </div>
      <div className="filtros-data">
        <input
          type="date"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
        />
        <input
          type="date"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
        />
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition' "
          onClick={() => listarPendencias(inicio, fim)}
        >
          Buscar
        </button>
      </div>
      {/* 🔹 Cards de resumo */}
      <div className="grid grid-cols-3 gap-6 w-full">
        <CardResumo
          titulo="Em aberto"
          valor={pendencias.filter((p) => p.status === "Em aberto").length}
          cor="bg-blue-500"
          ativo={filtroStatus === "Em aberto"}
          onClick={() => handleSelecionarCard("Em aberto")}
        />
        <CardResumo
          titulo="Devolvidos"
          valor={pendencias.filter((p) => p.status === "Devolvido").length}
          cor="bg-green-500"
          ativo={filtroStatus === "Devolvido"}
          onClick={() => handleSelecionarCard("Devolvido")}
        />

        <CardResumo
          titulo="Atrasado"
          valor={pendencias.filter((p) => p.status === "Atrasado").length}
          cor="bg-red-500"
          ativo={filtroStatus === "Atrasado"}
          onClick={() => handleSelecionarCard("Atrasado")}
        />
      </div>

      <div className="flex flex-col md:flex-row gap-2 w-full items-start">
        <TabelaPendencias
          pendencias={statusPendencias}
          filtroStatus={filtroStatus}
          onLimparFiltro={() => setFiltroStatus(null)}
        />
        <GraficoDoughnut
          className="flex-1"
          values={filtroStatus ? statusPendencias : pendencias}
        />
      </div>
    </div>
  );
}

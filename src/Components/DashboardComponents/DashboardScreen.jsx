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

  // ------------------- Ajusta a data inicial para o começo do dia e final para o fim do dia -------------------
  const ajustarDataFinal = (data) => {
    const d = new Date(data);
    d.setDate(d.getDate() + 1);
    d.setHours(23, 59, 59, 999);
    return d;
  };

  const ajustarDataInicial = (data) => {
    const d = new Date(data);
    d.setHours(0, 0, 0, 0);
    return d;
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
      const dataInicio = new Date(inicio);
      const dataFim = new Date(fim);
      dataFim.setHours(23, 59, 59, 999);

      const dados = await carregarPendencias(dataInicio, dataFim);
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
    const ontem = new Date(dataBR);
    ontem.setDate(ontem.getDate() - 1);
    setInicio(ontem.toISOString().split("T")[0]);
    setFim(dataBR.toISOString().split("T")[0]);
    listarPendencias(ajustarDataInicial(ontem), ajustarDataFinal(dataBR));
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
    <div className="flex flex-col w-full mt-6 px-5">
      {/* 🔹 Filtros de data */}
      <div className="flex justify-center items-end gap-3 mb-6 mt-2">
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Data inicial</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2"
            value={inicio}
            max={fim}
            onChange={(e) => setInicio(e.target.value)}
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1">Data final</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-3 py-2"
            value={fim}
            min={inicio}
            onChange={(e) => setFim(e.target.value)}
          />
        </div>

        <button
          className="bg-blue-500 text-white py-2 px-5 rounded-md hover:bg-blue-600 transition"
          onClick={() =>
            listarPendencias(new Date(inicio), ajustarDataFinal(fim))
          }
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

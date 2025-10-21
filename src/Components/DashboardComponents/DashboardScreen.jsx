import { useState, useEffect } from "react";
import CardResumo from "./CardResumo";
import TabelaPendencias from "./TabelaPendencias";
import GraficoDoughnut from "./GraficoDoughnut";
import GraficoRetiradosXDevolvidos from "./GraficoRetiradosXDevolvidos";
import { carregarPendencias } from "../../services/api";
import { differenceInMinutes } from "date-fns";
import MovPorHora from "./GraficoMovPorHora";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import FiltroDatas from "./ComponenteData/DateInput";

export default function Dashboard() {
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [dadosGrafico, setDadosGrafico] = useState([]);

  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 58 * 60 * 1000);

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

  // ------------------- Ajusta a data inicial e final -------------------
  const ajustarDataFinal = (data) => {
    const d = new Date(data);
    d.setDate(d.getDate());
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
  async function listarPendencias(inicio, fim) {
    try {
      const dataInicio = new Date(inicio);
      const dataFim = ajustarDataFinal(fim);

      const dados = await carregarPendencias(
        ajustarDataInicial(dataInicio),
        ajustarDataFinal(dataFim)
      );

      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          const minutos = differenceInMinutes(dataBR, new Date(item.date));
          return {
            colaborador: item.emplName,
            kit: item.employee.sector,
            data: item.date.toLocaleString("pt-BR"),
            dataDevolucao: item.devolDate
              ? item.devolDate.toLocaleString("pt-BR")
              : null,
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
  }

  // ------------------- Carrega os dados do gráfico / últimos 6 meses + últimas 24 hrs -------------------
  const listarRetiradosDevolvidos = async (inicio, fim) => {
    try {
      const dataInicio = inicio;
      const dataFim = ajustarDataFinal(fim);

      const dados = await carregarPendencias(
        ajustarDataInicial(dataInicio),
        ajustarDataFinal(dataFim)
      );
      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          const minutos = differenceInMinutes(dataBR, new Date(item.date));
          return {
            colaborador: item.emplName,
            kit: item.employee.sector,
            data: item.date,
            dataDevolucao: item.devolDate ? item.devolDate : null,
            status: definirStatus(item),
            tempo: formatarTempo(minutos),
          };
        });
        setDadosGrafico(formatadas);
      } else {
        console.warn("Formato inesperado de dados:", dados);
      }
    } catch (err) {
      console.error("Erro ao carregar pendências:", err);
    }
  };

  // ----------------- Inicializa a tela -----------------
  useEffect(() => {
    const ontem = new Date(dataBR);
    ontem.setDate(ontem.getDate() - 1);
    setInicio(ontem.toISOString().split("T")[0]);
    setFim(dataBR.toISOString().split("T")[0]);

    listarPendencias(ajustarDataInicial(ontem), ajustarDataFinal(dataBR));

    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(new Date().getMonth() - 5);
    listarRetiradosDevolvidos(seisMesesAtras, ajustarDataFinal(dataBR));
  }, []);

  useEffect(() => {
    if (inicio && fim) {
      // Atualiza dados sempre que as datas mudarem
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(new Date().getMonth() - 5);
      listarPendencias(ajustarDataInicial(inicio), ajustarDataFinal(fim));
    }
  }, [inicio, fim]);

  // ----------------- Filtro e resumo -----------------
  const statusPendencias = filtroStatus
    ? pendencias.filter((p) => p.status === filtroStatus)
    : pendencias;

  const handleSelecionarCard = (status) => {
    setFiltroStatus((prev) => (prev === status ? null : status));
  };

  // ----------------- Renderização -----------------
  return (
    <div className="flex flex-col w-full mt-6 ">
      {/* 🔹 Cards de resumo */}
      <div className="grid grid-cols-[10rem_auto_auto_auto] justify-stretch gap-6 w-full">
        <div className="grid grid-col-2 ">
          <label
            id="labelIntervalo"
            htmlFor="labelIntervalo"
            className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center gap-2 border-l-4 border-blue-500 pl-3"
          >
            Selecionar Intervalo
          </label>
          <FiltroDatas
            inicio={inicio}
            fim={fim}
            setInicio={setInicio}
            setFim={setFim}
          />
        </div>
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

      {/* 🔹 Tabela e Gráficos */}
      <div className="flex flex-col md:flex-row gap-3 w-full">
        <TabelaPendencias
          pendencias={statusPendencias}
          filtroStatus={filtroStatus}
          onLimparFiltro={() => setFiltroStatus(null)}
        />
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-4 flex-1">
          <GraficoDoughnut
            className="flex-1 flex items-center justify-center"
            values={filtroStatus ? statusPendencias : pendencias}
          />
          <GraficoRetiradosXDevolvidos
            className="flex-1 flex items-center justify-center"
            values={dadosGrafico}
          />
        </div>
      </div>
      <div>
        <MovPorHora className="w-full mt-2" values={dadosGrafico} />
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import CardResumo from "./CardResumo";
import TabelaPendencias from "./TabelaPendencias";
import GraficoDoughnut from "./GraficoDoughnut";
import GraficoRetiradosXDevolvidos from "./GraficoRetiradosXDevolvidos";
import MovPorHora from "./GraficoMovPorHora";
import FiltroDatas from "./ComponenteData/DateInput";
import { carregarPendencias } from "../../services/api";
import { differenceInMinutes } from "date-fns";

export default function Dashboard() {
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [pendencias, setPendencias] = useState([]);
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [dadosGrafico, setDadosGrafico] = useState([]);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

  const mostrarPopup = (mensagem, tipo = "info") => {
    setPopup({ mostrar: true, mensagem, tipo });
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 2000);
  };

  // ------------------- Define o status da Pendência -------------------
  const definirStatus = (item) => {
    const minutos = differenceInMinutes(dataBR, new Date(item.date));
    if (item.status === 1) return minutos <= 36 * 60 ? "Em aberto" : "Atrasado";
    if (item.status === 2) return "Devolvido";
    return "Desconhecido";
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

  const formatarTempo = (minutos) => {
    if (minutos < 60) return `${minutos} min`;
    const horas = Math.floor(minutos / 60);
    const restoMin = minutos % 60;
    return `${horas}h ${restoMin > 0 ? restoMin + "min" : ""}`;
  };

  // ------------------- Carregar pendências -------------------
  const listarPendencias = async (inicioData, fimData) => {
    setLoading(true);
    try {
      const dados = await carregarPendencias(
        ajustarDataInicial(inicioData),
        ajustarDataFinal(fimData)
      );
      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          const minutos = differenceInMinutes(dataBR, new Date(item.date));
          return {
            colaborador: item.emplName,
            kit: item.employee?.sector || "-",
            data: item.date,
            dataDevolucao: item.devolDate
              ? item.devolDate
              : "-",
            status: definirStatus(item),
            tempo: formatarTempo(minutos),
          };
        });
        setPendencias(formatadas);
      } else {
        mostrarPopup("Nenhuma pendência encontrada.", "info");
      }
    } catch (err) {
      console.error(err);
      mostrarPopup("Erro ao carregar pendências.", "error");
    } finally {
      setLoading(false);
    }
  };

  const listarRetiradosDevolvidos = async (inicioData, fimData) => {
    try {
      const dados = await carregarPendencias(
        ajustarDataInicial(inicioData),
        ajustarDataFinal(fimData)
      );
      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          const minutos = differenceInMinutes(dataBR, new Date(item.date));
          return {
            colaborador: item.emplName,
            kit: item.employee?.sector || "-",
            data: item.date,
            dataDevolucao: item.devolDate || null,
            status: definirStatus(item),
            tempo: formatarTempo(minutos),
          };
        });
        setDadosGrafico(formatadas);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ------------------- Inicialização -------------------
  useEffect(() => {
    const ontem = new Date(dataBR);
    ontem.setDate(ontem.getDate() - 1);
    setInicio(ontem.toISOString().split("T")[0]);
    setFim(dataBR.toISOString().split("T")[0]);
    listarPendencias(ontem, dataBR);

    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(new Date().getMonth() - 5);
    listarRetiradosDevolvidos(seisMesesAtras, dataBR);
  }, []);

  useEffect(() => {
    if (inicio && fim) listarPendencias(inicio, fim);
  }, [inicio, fim]);

  const statusPendencias = filtroStatus
    ? pendencias.filter((p) => p.status === filtroStatus)
    : pendencias;

  const handleSelecionarCard = (status) => {
    setFiltroStatus((prev) => (prev === status ? null : status));
  };

  return (
    <div className="flex flex-col w-full mt-10">
      {/* Cards de resumo */}
      <div className="grid grid-cols-[10rem_auto_auto_auto] justify-stretch gap-6 w-full">
        <div className="grid grid-col-2">
          <label className="text-lg sm:text-xl font-semibold text-gray-700 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
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

      {/* Tabela e gráficos */}
      <div className="flex flex-col md:flex-row gap-3 w-full mt-4">
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

      {/* Loading */}
      {loading && (
        <div className="text-center mt-6 text-gray-600 animate-pulse">
          Carregando...
        </div>
      )}

      {/* Popup */}
      {popup.mostrar && (
        <div
          className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-opacity ${
            popup.tipo === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {popup.mensagem}
        </div>
      )}
    </div>
  );
}

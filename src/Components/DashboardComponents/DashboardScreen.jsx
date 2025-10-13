import { useState, useEffect } from "react";
import CardResumo from "./CardResumo";
import TabelaPendencias from "./TabelaPendencias";
import GraficoDoughnut from "./GraficoDoughnut";
import { carregarPendencias } from "../../services/api";
import { differenceInMinutes } from "date-fns";

export default function Dashboard() {
  const [filtroStatus, setFiltroStatus] = useState(null);
  const [pendencias, setPendencias] = useState([]);

  const agora = new Date();
  const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);

  // 🔹 Carregar pendências da API
  const listarPendencias = async () => {
    try {
      const dados = await carregarPendencias();
      if (dados?.success && Array.isArray(dados.data)) {
        const formatadas = dados.data.map((item) => {
          let statusFinal = "";
          const intervaloHoras = differenceInMinutes(
            dataBR,
            new Date(item.date)
          );
          // 🔹 Status = 1 → Em aberto
          if (item.status === 1) {
            if (intervaloHoras < 24) {
              statusFinal = "Retirados Hoje";
            } else if (intervaloHoras >= 24 && intervaloHoras <= 36) {
              statusFinal = "Pendente";
            } else if (intervaloHoras > 36) {
              statusFinal = "Atrasado";
            }
          }
          // 🔹 Status = 2 → Devolvido
          else if (item.status === 2) {
            if (intervaloHoras < 24) {
              statusFinal = "Devolvido Hoje";
            } else {
              statusFinal = "Devolvido";
            }
          }
          return {
            colaborador: item.emplName,
            kit: item.employee.sector,
            data: new Date(item.date).toLocaleString("pt-BR"),
            status: statusFinal,
            tempo:
              intervaloHoras < 60
                ? intervaloHoras + " min"
                : Math.floor(intervaloHoras / 60) + " hrs",
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

  useEffect(() => {
    listarPendencias();
  }, []);

  const formatadas = filtroStatus
    ? pendencias.filter((p) => p.status === filtroStatus)
    : pendencias;

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

      {/* 🔹 Cards de resumo */}
      <div className="grid grid-cols-4 gap-6 w-full">
        <CardResumo
          titulo="Retirados Hoje"
          valor={pendencias.filter((p) => p.status === ("Pendente" && "Devolvido")).length}
          cor="bg-blue-500"
          ativo={filtroStatus === "Retirados Hoje"}
          onClick={() => handleSelecionarCard("Pendente")}
        />
        <CardResumo
          titulo="Devolvidos"
          valor={pendencias.filter((p) => p.status === "Devolvido").length}
          cor="bg-green-500"
          ativo={filtroStatus === "Devolvido"}
          onClick={() => handleSelecionarCard("Devolvido")}
        />
        <CardResumo
          titulo="Pendente"
          valor={pendencias.filter((p) => p.status === "Pendente").length}
          cor="bg-yellow-500"
          ativo={filtroStatus === "Pendente"}
          onClick={() => handleSelecionarCard("Pendente")}
        />
        <CardResumo
          titulo="Atrasado"
          valor={pendencias.filter((p) => p.status === "Atrasado").length}
          cor="bg-red-500"
          ativo={filtroStatus === "Atrasado"}
          onClick={() => handleSelecionarCard("Atrasado")}
        />
      </div>

      {/* 🔹 Gráfico + tabela */}
      <div className="flex flex-col md:flex-row gap-2 w-full items-start">
        <TabelaPendencias
          pendencias={formatadas}
          filtroStatus={filtroStatus}
          onLimparFiltro={() => setFiltroStatus(null)}
        />
        <GraficoDoughnut values={filtroStatus ? formatadas : pendencias} />
      </div>
    </div>
  );
}

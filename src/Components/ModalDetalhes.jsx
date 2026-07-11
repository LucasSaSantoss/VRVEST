import React from "react";

export default function ModalDetalhesLog({ mostrar, onClose, log }) {
  if (!mostrar || !log) return null;

  const traduzirValor = (campo, valor) => {
    if (valor === null || valor === undefined) return "-";

    switch (campo) {
      case "active":
        return Number(valor) === 1 ? "Ativo" : "Inativo";

      case "level":
        return (
          {
            1: "Usuário",
            2: "Supervisor",
            3: "Administrador",
          }[Number(valor)] || valor
        );

      case "password":
        return "••••••••";

      default:
        return valor;
    }
  };

  const obterAlteracoes = () => {
    if (!log.changes) return [];

    if ("campo" in log.changes) {
      return [
        {
          campo: log.changes.campo,
          antigo: log.changes.de,
          novo: log.changes.para,
        },
      ];
    }
    return Object.entries(log.changes).map(([campo, valores]) => ({
      campo,
      antigo: valores.old,
      novo: valores.new,
    }));
  };

  const nomesCampos = {
    active: "Status",
    level: "Nível",
    password: "Senha",
    matricula: "Matrícula",
    name: "Nome",
    email: "E-mail",
    sector: "Setor",
    position: "Cargo",
    itemVal: "Valor",
  };

  const renderTabelaAlteracoes = () => {
    if (!log.changes)
      return (
        <p className=" px-4 py-4 text-gray-500 italic">
          Nenhuma alteração registrada.
        </p>
      );

    return (
      <div className="overflow-hidden rounded-xl border border-slate-200">
        <table className="w-full">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-8 py-4 text-left font-semibold text-slate-600">
                Campo
              </th>

              <th className="px-8 py-4 text-left font-semibold text-red-600">
                Valor anterior
              </th>

              <th className="px-8 py-4 text-left font-semibold text-green-600">
                Novo valor
              </th>
            </tr>
          </thead>

          <tbody>
            {obterAlteracoes().map((item, index) => (
              <tr
                key={item.campo}
                className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
              >
                <td className="px-8 py-6 font-medium text-slate-700">
                  {nomesCampos[item.campo] || item.campo}
                </td>

                <td className="px-8 py-6">
                  <span className="inline-flex px-4 py-2 rounded-full bg-red-100 text-red-700">
                    {traduzirValor(item.campo, item.antigo)}
                  </span>
                </td>

                <td className="px-8 py-6">
                  <span className="inline-flex px-4 py-2 rounded-full bg-green-100 text-green-700">
                    {traduzirValor(item.campo, item.novo)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderDados = () => {
    if (!log.newData)
      return <p className="text-gray-500 italic">Nenhum dado disponível.</p>;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(log.newData).map(([campo, valor]) => (
          <div className="border rounded-xl p-4 bg-white shadow-sm">
            <div className="text-xs uppercase tracking-wide text-gray-500">
              {nomesCampos[campo] || campo}
            </div>

            <div className="font-semibold text-gray-800 mt-2 break-all">
              {typeof valor === "object"
                ? JSON.stringify(valor)
                : traduzirValor(campo, valor)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl max-h-[90vh] overflow-auto pl-5 pb-5 pr-5">
        <div className="mt-8">
          <div className="flex px-6 justify-between py-4 border-b ">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Alterações realizadas
              </h3>
              <p className="text-sm text-slate-500 mt-1 mb-5">
                Abaixo estão os campos que sofreram alteração nesta operação.
              </p>
            </div>
            <div className="px-6 py-4 flex justify-end">
              <button
                onClick={onClose}
                className="bg-red-800 hover:bg-red-600 text-white px-5 py-2 rounded-lg transition"
              >
                Fechar
              </button>
            </div>
          </div>

          {renderTabelaAlteracoes()}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Usuário
            </p>

            <p className="mt-2 text-lg font-semibold text-slate-800">
              {log.name}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Ação
            </p>

            <span className="inline-flex mt-3 px-4 py-2 rounded-full bg-blue-100 text-blue-700 font-medium">
              {log.action}
            </span>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Data da Alteração
            </p>

            <p className="mt-2 text-lg font-semibold text-slate-800">
              {new Date(log.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useCallback, useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";
import { useMemo, useRef } from "react";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

const normalizarNomeUniforme = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleUpperCase("pt-BR");

const formatarMoedaPtBrInput = (valor) => {
  const somenteDigitos = String(valor || "").replace(/\D/g, "");
  if (!somenteDigitos) return "";

  const numero = Number(somenteDigitos) / 100;
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatarMoedaPtBrExibicao = (valor) => {
  const somenteDigitos = String(valor || "").replace(/\D/g, "");
  if (!somenteDigitos) return "0,00";

  const numero = Number(somenteDigitos) / 100;
  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

function Modal({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 font-bold">
            X
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

export default function CadastroUniformes() {
  const [uniformes, setUniformes] = useState([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [popup, setPopup] = useState(INITIAL_POPUP);
  const [loading, setLoading] = useState(false);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [processingAction, setProcessingAction] = useState("");
  const actionLockRef = useRef(new Set());
  const ITENS_POR_PAGINA = 10;

  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoAtivo, setNovoAtivo] = useState("1");
  const [novoValidadePlantonistaMeses, setNovoValidadePlantonistaMeses] = useState("12");
  const [novoValidadeDiaristaMeses, setNovoValidadeDiaristaMeses] = useState("12");

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editAtivo, setEditAtivo] = useState("1");
  const [editValidadePlantonistaMeses, setEditValidadePlantonistaMeses] = useState("12");
  const [editValidadeDiaristaMeses, setEditValidadeDiaristaMeses] = useState("12");

  const showTemporaryPopup = (message, type = "info") => {
    setPopup({ show: true, message, type });
    setTimeout(() => setPopup(INITIAL_POPUP), 3500);
  };

  const carregarUniformes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/items/uniforms");
      if (res.data?.success) {
        setUniformes(res.data.data || []);
        setPaginaAtual(1);
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao carregar uniformes."), "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarUniformes();
  }, [carregarUniformes]);

  const uniformesFiltrados = useMemo(() => {
    const termo = filtroNome.trim().toLocaleLowerCase("pt-BR");
    return uniformes.filter((uniforme) => {
      const correspondeNome =
        !termo || String(uniforme.itemName || "").toLocaleLowerCase("pt-BR").includes(termo);
      const correspondeStatus =
        filtroStatus === "TODOS" ||
        (filtroStatus === "ATIVOS" && Number(uniforme.active) === 1) ||
        (filtroStatus === "INATIVOS" && Number(uniforme.active) !== 1);
      return correspondeNome && correspondeStatus;
    });
  }, [uniformes, filtroNome, filtroStatus]);

  useEffect(() => {
    setPaginaAtual(1);
  }, [filtroNome, filtroStatus]);

  const resetNovo = () => {
    setNovoNome("");
    setNovoValor("");
    setNovoAtivo("1");
    setNovoValidadePlantonistaMeses("12");
    setNovoValidadeDiaristaMeses("12");
  };

  const executarAcaoUnica = async (actionKey, callback) => {
    if (actionLockRef.current.has(actionKey)) return;
    actionLockRef.current.add(actionKey);
    setProcessingAction(actionKey);
    try {
      await callback();
    } finally {
      actionLockRef.current.delete(actionKey);
      setProcessingAction("");
    }
  };

  const cadastrarUniforme = () =>
    executarAcaoUnica("create", async () => {
      try {
        if (!novoNome.trim() || !novoValor.trim()) {
          showTemporaryPopup("Informe nome e valor do uniforme.", "error");
          return;
        }
        const nomeDuplicado = uniformes.some(
          (uniforme) =>
            normalizarNomeUniforme(uniforme.itemName) ===
            normalizarNomeUniforme(novoNome)
        );
        if (nomeDuplicado) {
          showTemporaryPopup("Já existe um uniforme cadastrado com esse nome.", "error");
          return;
        }
        const res = await api.post("/items/uniforms", {
          itemName: novoNome.trim(),
          itemVal: novoValor.trim(),
          active: Number(novoAtivo),
          validadePlantonistaMeses: Number(novoValidadePlantonistaMeses),
          validadeDiaristaMeses: Number(novoValidadeDiaristaMeses),
        });
        if (res.data?.success) {
          showTemporaryPopup("Uniforme cadastrado com sucesso.", "success");
          setShowNovoModal(false);
          resetNovo();
          await carregarUniformes();
        }
      } catch (error) {
        showTemporaryPopup(obterMensagemErroApi(error, "Erro ao cadastrar uniforme."), "error");
      }
    });

  const abrirEdicao = (u) => {
    setEditando(u);
    setEditNome(u.itemName || "");
    setEditValor(formatarMoedaPtBrInput(u.itemVal || ""));
    setEditAtivo(String(u.active || 0));
    setEditValidadePlantonistaMeses(String(u.validadePlantonistaMeses ?? 12));
    setEditValidadeDiaristaMeses(String(u.validadeDiaristaMeses ?? 12));
  };

  const salvarEdicao = () =>
    executarAcaoUnica("edit", async () => {
      try {
        if (!editando) return;
        if (!editNome.trim() || !editValor.trim()) {
          showTemporaryPopup("Informe nome e valor do uniforme.", "error");
          return;
        }
        const nomeDuplicado = uniformes.some(
          (uniforme) =>
            Number(uniforme.id) !== Number(editando.id) &&
            normalizarNomeUniforme(uniforme.itemName) ===
              normalizarNomeUniforme(editNome)
        );
        if (nomeDuplicado) {
          showTemporaryPopup("Já existe outro uniforme cadastrado com esse nome.", "error");
          return;
        }

        const res = await api.put(`/items/uniforms/${editando.id}`, {
          itemName: editNome.trim(),
          itemVal: editValor.trim(),
          active: Number(editAtivo),
          validadePlantonistaMeses: Number(editValidadePlantonistaMeses),
          validadeDiaristaMeses: Number(editValidadeDiaristaMeses),
        });
        if (res.data?.success) {
          showTemporaryPopup("Uniforme atualizado com sucesso.", "success");
          setEditando(null);
          await carregarUniformes();
        }
      } catch (error) {
        showTemporaryPopup(obterMensagemErroApi(error, "Erro ao atualizar uniforme."), "error");
      }
    });

  const alternarStatus = (u) =>
    executarAcaoUnica(`status-${u.id}`, async () => {
      try {
        const res = await api.put(`/items/uniforms/${u.id}`, { active: u.active === 1 ? 0 : 1 });
        if (res.data?.success) {
          showTemporaryPopup("Status do uniforme atualizado.", "success");
          await carregarUniformes();
        }
      } catch (error) {
        showTemporaryPopup(obterMensagemErroApi(error, "Erro ao atualizar status do uniforme."), "error");
      }
    });

  return (
    <div className="w-full max-w-6xl mx-auto mt-4 pb-6">
      <div className="mb-4 border-l-4 border-blue-500 pl-3">
        <h2 className="text-xl font-bold text-gray-800">Cadastro de Uniformes</h2>
        <p className="text-gray-600 text-sm">Gestão de uniformes ativos/inativos, valores e estoque mínimo.</p>
      </div>

      <section className="bg-white rounded-xl shadow p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-700">Uniformes Cadastrados</h3>
          <button
            onClick={() => setShowNovoModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
          >
            Novo Uniforme
          </button>
        </div>

        {/* [MANUTENCAO] Motivo: facilitar localização de uniformes no cadastro.
            [MANUTENCAO] Impacto: filtros locais por nome e status, sem alterar contrato da API.
            [MANUTENCAO] Data: 2026-06-22
            [MANUTENCAO] Autor: Márlon Etiene */}
        <div className="grid grid-cols-1 gap-2 mb-3 md:grid-cols-[1fr_220px]">
          <input
            type="text"
            value={filtroNome}
            onChange={(event) => setFiltroNome(event.target.value)}
            placeholder="Buscar uniforme por nome"
            className="rounded border px-3 py-2 text-sm"
          />
          <select
            value={filtroStatus}
            onChange={(event) => setFiltroStatus(event.target.value)}
            className="rounded border px-3 py-2 text-sm"
          >
            <option value="TODOS">Todos os status</option>
            <option value="ATIVOS">Somente ativos</option>
            <option value="INATIVOS">Somente inativos</option>
          </select>
        </div>

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : uniformesFiltrados.length === 0 ? (
          <p className="text-gray-600">Nenhum uniforme encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Nome</th>
                  <th>Valor</th>
                  <th>Val. Plantonista</th>
                  <th>Val. Diarista</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {uniformesFiltrados
                  .slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA)
                  .map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.itemName}</td>
                    <td>{formatarMoedaPtBrExibicao(u.itemVal)}</td>
                    <td>{Number(u.validadePlantonistaMeses ?? 12)} mês(es)</td>
                    <td>{Number(u.validadeDiaristaMeses ?? 12)} mês(es)</td>
                    <td>
                      <span className={`text-xs font-semibold ${u.active === 1 ? "text-green-700" : "text-red-700"}`}>
                        {u.active === 1 ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => abrirEdicao(u)}
                          className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1 rounded text-xs font-semibold"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => alternarStatus(u)}
                          disabled={Boolean(processingAction)}
                          className={`text-white px-3 py-1 rounded text-xs font-semibold ${
                            processingAction
                              ? "bg-gray-400"
                              : u.active === 1
                                ? "bg-red-600 hover:bg-red-700"
                                : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {processingAction === `status-${u.id}`
                            ? "Aguarde..."
                            : u.active === 1
                              ? "Desabilitar"
                              : "Habilitar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
              <span>
                Página {paginaAtual} de {Math.max(1, Math.ceil(uniformesFiltrados.length / ITENS_POR_PAGINA))}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Primeiro
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual === 1}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPaginaAtual((p) =>
                      Math.min(Math.ceil(uniformesFiltrados.length / ITENS_POR_PAGINA), p + 1)
                    )
                  }
                  disabled={paginaAtual >= Math.ceil(uniformesFiltrados.length / ITENS_POR_PAGINA)}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Próxima
                </button>
                <button
                  onClick={() =>
                    setPaginaAtual(Math.max(1, Math.ceil(uniformesFiltrados.length / ITENS_POR_PAGINA)))
                  }
                  disabled={
                    paginaAtual >= Math.max(1, Math.ceil(uniformesFiltrados.length / ITENS_POR_PAGINA))
                  }
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Último
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      <Modal open={showNovoModal} title="Novo Uniforme" onClose={() => setShowNovoModal(false)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do uniforme</label>
            <input className="border rounded px-3 py-2 w-full" value={novoNome} onChange={(e) => setNovoNome(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do uniforme</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={novoValor}
              onChange={(e) => setNovoValor(formatarMoedaPtBrInput(e.target.value))}
              placeholder="0,00"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="border rounded px-3 py-2 w-full" value={novoAtivo} onChange={(e) => setNovoAtivo(e.target.value)}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade Plantonista (meses)</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={novoValidadePlantonistaMeses}
              onChange={(e) => setNovoValidadePlantonistaMeses(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={`novo-plant-${idx + 1}`} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade Diarista (meses)</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={novoValidadeDiaristaMeses}
              onChange={(e) => setNovoValidadeDiaristaMeses(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={`novo-dia-${idx + 1}`} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button disabled={Boolean(processingAction)} onClick={cadastrarUniforme} className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-4 py-2 rounded">{processingAction === "create" ? "Salvando..." : "Salvar"}</button>
          <button disabled={Boolean(processingAction)} onClick={() => setShowNovoModal(false)} className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-semibold px-4 py-2 rounded">Cancelar</button>
        </div>
      </Modal>

      <Modal open={Boolean(editando)} title="Editar Uniforme" onClose={() => setEditando(null)}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome do uniforme</label>
            <input className="border rounded px-3 py-2 w-full" value={editNome} onChange={(e) => setEditNome(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor do uniforme</label>
            <input
              className="border rounded px-3 py-2 w-full"
              value={editValor}
              onChange={(e) => setEditValor(formatarMoedaPtBrInput(e.target.value))}
              placeholder="0,00"
              inputMode="numeric"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="border rounded px-3 py-2 w-full" value={editAtivo} onChange={(e) => setEditAtivo(e.target.value)}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade Plantonista (meses)</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={editValidadePlantonistaMeses}
              onChange={(e) => setEditValidadePlantonistaMeses(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={`edit-plant-${idx + 1}`} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Validade Diarista (meses)</label>
            <select
              className="border rounded px-3 py-2 w-full"
              value={editValidadeDiaristaMeses}
              onChange={(e) => setEditValidadeDiaristaMeses(e.target.value)}
            >
              {Array.from({ length: 12 }).map((_, idx) => (
                <option key={`edit-dia-${idx + 1}`} value={idx + 1}>
                  {idx + 1}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button disabled={Boolean(processingAction)} onClick={salvarEdicao} className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white font-semibold px-4 py-2 rounded">{processingAction === "edit" ? "Salvando..." : "Salvar Edição"}</button>
          <button disabled={Boolean(processingAction)} onClick={() => setEditando(null)} className="bg-gray-200 hover:bg-gray-300 disabled:opacity-50 text-gray-800 font-semibold px-4 py-2 rounded">Cancelar</button>
        </div>
      </Modal>

      {popup.show && (
        <div className={`fixed top-5 right-5 z-[70] px-4 py-2 rounded shadow text-white ${popup.type === "success" ? "bg-green-600" : "bg-red-600"}`}>
          {popup.message}
        </div>
      )}
    </div>
  );
}


import { useCallback, useEffect, useState } from "react";
import { api, obterMensagemErroApi } from "../../services/api";

const INITIAL_POPUP = { show: false, message: "", type: "info" };

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
  const ITENS_POR_PAGINA = 10;

  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoAtivo, setNovoAtivo] = useState("1");

  const [showNovoModal, setShowNovoModal] = useState(false);
  const [editando, setEditando] = useState(null);
  const [editNome, setEditNome] = useState("");
  const [editValor, setEditValor] = useState("");
  const [editAtivo, setEditAtivo] = useState("1");

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

  const resetNovo = () => {
    setNovoNome("");
    setNovoValor("");
    setNovoAtivo("1");
  };

  const cadastrarUniforme = async () => {
    try {
      if (!novoNome.trim() || !novoValor.trim()) {
        showTemporaryPopup("Informe nome e valor do uniforme.", "error");
        return;
      }
      const res = await api.post("/items/uniforms", {
        itemName: novoNome.trim(),
        itemVal: novoValor.trim(),
        active: Number(novoAtivo),
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
  };

  const abrirEdicao = (u) => {
    setEditando(u);
    setEditNome(u.itemName || "");
    setEditValor(u.itemVal || "");
    setEditAtivo(String(u.active || 0));
  };

  const salvarEdicao = async () => {
    try {
      if (!editando) return;
      if (!editNome.trim() || !editValor.trim()) {
        showTemporaryPopup("Informe nome e valor do uniforme.", "error");
        return;
      }

      const res = await api.put(`/items/uniforms/${editando.id}`, {
        itemName: editNome.trim(),
        itemVal: editValor.trim(),
        active: Number(editAtivo),
      });
      if (res.data?.success) {
        showTemporaryPopup("Uniforme atualizado com sucesso.", "success");
        setEditando(null);
        await carregarUniformes();
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao atualizar uniforme."), "error");
    }
  };

  const alternarStatus = async (u) => {
    try {
      const res = await api.put(`/items/uniforms/${u.id}`, { active: u.active === 1 ? 0 : 1 });
      if (res.data?.success) {
        showTemporaryPopup("Status do uniforme atualizado.", "success");
        await carregarUniformes();
      }
    } catch (error) {
      showTemporaryPopup(obterMensagemErroApi(error, "Erro ao atualizar status do uniforme."), "error");
    }
  };

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

        {loading ? (
          <p className="text-gray-600">Carregando...</p>
        ) : uniformes.length === 0 ? (
          <p className="text-gray-600">Nenhum uniforme cadastrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="py-2">Nome</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {uniformes
                  .slice((paginaAtual - 1) * ITENS_POR_PAGINA, paginaAtual * ITENS_POR_PAGINA)
                  .map((u) => (
                  <tr key={u.id} className="border-b">
                    <td className="py-2">{u.itemName}</td>
                    <td>{u.itemVal}</td>
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
                          className={`text-white px-3 py-1 rounded text-xs font-semibold ${
                            u.active === 1 ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
                          }`}
                        >
                          {u.active === 1 ? "Desabilitar" : "Habilitar"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex items-center justify-between mt-3 text-sm text-gray-700">
              <span>
                Página {paginaAtual} de {Math.max(1, Math.ceil(uniformes.length / ITENS_POR_PAGINA))}
              </span>
              <div className="flex gap-2">
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
                      Math.min(Math.ceil(uniformes.length / ITENS_POR_PAGINA), p + 1)
                    )
                  }
                  disabled={paginaAtual >= Math.ceil(uniformes.length / ITENS_POR_PAGINA)}
                  className="px-3 py-1 rounded border disabled:opacity-50"
                >
                  Próxima
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
            <input className="border rounded px-3 py-2 w-full" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="border rounded px-3 py-2 w-full" value={novoAtivo} onChange={(e) => setNovoAtivo(e.target.value)}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={cadastrarUniforme} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded">Salvar</button>
          <button onClick={() => setShowNovoModal(false)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded">Cancelar</button>
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
            <input className="border rounded px-3 py-2 w-full" value={editValor} onChange={(e) => setEditValor(e.target.value)} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="border rounded px-3 py-2 w-full" value={editAtivo} onChange={(e) => setEditAtivo(e.target.value)}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </select>
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <button onClick={salvarEdicao} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-4 py-2 rounded">Salvar Edição</button>
          <button onClick={() => setEditando(null)} className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold px-4 py-2 rounded">Cancelar</button>
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


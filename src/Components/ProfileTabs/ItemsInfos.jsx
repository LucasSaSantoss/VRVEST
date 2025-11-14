import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import { alterarItens, listarItems } from "../../services/api";

export default function PasswordChange() {
  const [pijamaValue, setPijamaValue] = useState(""); // valor original
  const [novoPijamaValue, setNovoPijamaValue] = useState(""); // valor que o usuário digita
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  const mostrarPopup = (mensagem, tipo = "info") => {
    setPopup({ mostrar: true, mensagem, tipo });
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
  };

  const limparValores = (e, setState) => {
    let valor = e.target.value.replace(/[^\d,]/g, "");
    const partes = valor.split(",");
    if (partes.length > 2) valor = partes[0] + "," + partes.slice(1).join("");
    setState(valor);
  };

  const handleKeyEnter = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSalvarAlteracao();
    }
  };

  useEffect(() => {
    async function fetchItems() {
      const res = await listarItems();
      if (res.success) {
        const pijamaItem = res.data.find(
          (item) => item.itemName === "Pijama Cirúrgico"
        );
        if (pijamaItem) {
          setPijamaValue(pijamaItem.itemVal);
          setNovoPijamaValue(pijamaItem.itemVal);
        }
      } else {
        mostrarPopup("Erro ao carregar itens", "error");
      }
    }
    fetchItems();
  }, []);

  async function handleSalvarAlteracao() {
    const token = localStorage.getItem("token");
    if (!token) {
      mostrarPopup("Token não identificado!", "error");
      return;
    }

    let idUser;
    try {
      const decodedToken = jwtDecode(token);
      idUser = decodedToken.id;
    } catch (err) {
      console.error("Erro ao verificar token:", err);
      localStorage.removeItem("token");
      mostrarPopup("Token inválido, faça login novamente.", "error");
      return;
    }

    // 🔹 Verifica se o valor foi realmente alterado
    if (novoPijamaValue === pijamaValue) {
      mostrarPopup("O preço não foi alterado.", "error");
      return;
    }

    const valorLimpo = novoPijamaValue.replace(",", ".");
    const valorNumerico = parseFloat(valorLimpo);

    if (isNaN(valorNumerico) || !/^\d+(,\d{1,2})?$/.test(novoPijamaValue)) {
      mostrarPopup("Por favor, insira um valor numérico válido.", "error");
      return;
    }

    try {
      const response = await alterarItens(idUser, novoPijamaValue);
      if (response.success) {
        // atualiza o valor salvo
        setPijamaValue(novoPijamaValue);
        mostrarPopup("Preço atualizado com sucesso!", "success");
      } else {
        mostrarPopup("Erro ao atualizar preço.", "error");
      }
    } catch (err) {
      console.error("Erro ao salvar:", err);
      mostrarPopup("Erro no servidor.", "error");
    }
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl max-w-full max-h-full mx-auto p-6 border border-gray-200 hover:shadow-2xl transition-all duration-300 ease-in-out">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Configuração dos Itens da Rouparia
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Nesta aba é possível visualizar e alterar os valores dos itens
        disponíveis na rouparia.
      </p>

      <form className="flex flex-col space-y-5">
        <div className="flex flex-col">
          <label htmlFor="pijama" className="text-gray-700 font-medium mb-1">
            Pijama Cirúrgico
          </label>
          <input
            id="pijama"
            value={novoPijamaValue}
            onChange={(e) => limparValores(e, setNovoPijamaValue)}
            type="text"
            maxLength={10}
            onKeyDown={handleKeyEnter}
            placeholder="0,00"
            className={`bg-white max-w-[120px] text-right border rounded-lg h-11 px-4 text-gray-800 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>

        <button
          type="button"
          onClick={handleSalvarAlteracao}
          className="max-w-[200px] mt-4 bg-green-600 text-white font-semibold py-2.5 rounded-lg hover:bg-green-700 hover:shadow-md active:scale-[0.98] transition-all"
        >
          Salvar Alterações
        </button>
      </form>

      {popup.mostrar && (
        <div
          className={`fixed bottom-5 right-5 px-5 py-3 rounded-lg shadow-lg text-white ${
            popup.tipo === "success"
              ? "bg-green-500"
              : popup.tipo === "error"
                ? "bg-red-500"
                : "bg-blue-500"
          }`}
        >
          {popup.mensagem}
        </div>
      )}
    </div>
  );
}

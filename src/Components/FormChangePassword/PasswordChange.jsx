import { useState } from "react";
import { Navigate } from "react-router-dom";
import { alterarSenha } from "../../services/api";
import { jwtDecode } from "jwt-decode";

export default function ProfileUser() {
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [novaSenhaAtt, setNovaSenhaAtt] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [idUser, setIdUser] = useState("");
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  const mostrarPopup = (mensagem, tipo = "info") => {
    setPopup({ mostrar: true, mensagem, tipo });
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
  };
  const showTemporaryPopup = (msg) => {
    setPopupMessage(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  async function handlePasswordChange(e) {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) {
      mostrarPopup("token não identificado!", "error");
      return;
    }

    try {
      const decodedToken = jwtDecode(token);
      setIdUser(decodedToken.id);
    } catch (err) {
      console.error("Erro ao verificar token:", err);
      localStorage.removeItem("token");
      showTemporaryPopup("Token inválido, faça login novamente.");
    }

    if (!senhaAtual || !novaSenha || !novaSenhaAtt) {
      mostrarPopup("Preencha todos os campos!", "error");
      return;
    }

    if (novaSenha !== novaSenhaAtt) {
      mostrarPopup("As senhas não coincidem!", "error");
      return;
    }

    const res = await alterarSenha({
      id: idUser,
      oldPassword: senhaAtual,
      newPassword: novaSenha,
    });

    if (res.success) {
      mostrarPopup(res.message, "success");
      setSenhaAtual("");
      setNovaSenha("");
      setNovaSenhaAtt("");
    } else {
      mostrarPopup(res.message, "error");
    }
  }

  return (
    <div className="bg-white shadow-xl rounded-2xl max-w-[700px] mx-auto p-6 mt-[10rem] border border-gray-200 hover:shadow-2xl transition-all duration-300 ease-in-out">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">
        Perfil do Usuário
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Nesta tela é possível alterar sua senha de acesso
      </p>

      <form className="flex flex-col space-y-5">
        <div className="flex flex-col">
          <label
            htmlFor="senhaAnterior"
            className="text-gray-700 font-medium mb-1"
          >
            Senha atual
          </label>
          <input
            id="senhaAnterior"
            value={senhaAtual}
            onChange={(e) => setSenhaAtual(e.target.value)}
            type="password"
            placeholder="Digite sua senha atual"
            className="bg-gray-100 border border-gray-300 rounded-lg h-11 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label htmlFor="novaSenha" className="text-gray-700 font-medium mb-1">
            Nova senha
          </label>
          <input
            id="novaSenha"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            type="password"
            placeholder="Digite a nova senha"
            className="bg-gray-100 border border-gray-300 rounded-lg h-11 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <div className="flex flex-col">
          <label
            htmlFor="confirmarSenha"
            className="text-gray-700 font-medium mb-1"
          >
            Confirmar nova senha
          </label>
          <input
            id="confirmarSenha"
            value={novaSenhaAtt}
            onChange={(e) => setNovaSenhaAtt(e.target.value)}
            type="password"
            placeholder="Confirme sua nova senha"
            className="bg-gray-100 border border-gray-300 rounded-lg h-11 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
        </div>

        <button
          type="button"
          onClick={handlePasswordChange}
          className="max-w-[200px] mt-4 bg-blue-500 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 hover:shadow-md active:scale-[0.98] transition-all"
        >
          Alterar senha
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

import React, { useState } from "react";
import { cadastrarEmail } from "../../services/api";

export default function PopupEmail({
  cpf,
  onClose,
  onSuccess,
  showTemporaryPopup,
}) {
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [success, setSuccess] = useState(false);
  const salvarEmail = async () => {
    setMensagem("");
    setSuccess(false);

    if (!email || !confirmEmail) {
      setMensagem("Preencha todos os campos!");
      return;
    }

    if (email !== confirmEmail) {
      setMensagem("Os emails não coincidem. Verifique e tente novamente.");
      return;
    }

    const resp = await cadastrarEmail({ cpf, email });

    if (resp.success) {
      setMensagem("Email cadastrado com sucesso!");
      setEmail("");
      setTimeout(() => {
        onSuccess();
      }, 800);
    } else {
      setSuccess(true);
      setMensagem(resp.message || "Erro ao cadastrar email.");
    }
  };

  const limparEmail = (e, setState) => {
    let valor = e.target.value;
    const primeiraArroba = valor.indexOf("@");
    if (primeiraArroba !== -1) {
      valor =
        valor.slice(0, primeiraArroba + 1) +
        valor.slice(primeiraArroba + 1).replace(/@/g, "");
    }
    valor = valor.replace(/\s+/g, " ");
    valor = valor.trimStart();
    valor = valor.replace(/(.)\1{2,}/g, "$1$1$1");
    valor = valor.replace(/[^a-zA-ZÀ-ú@0-9._ -]/g, "");
    valor = valor.toLowerCase();
    setState(valor);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-2xl shadow-xl w-96">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">Cadastrar Email</h2>
          <button className="text-red-500 text-xl" onClick={onClose}>
            ✖
          </button>
        </div>

        <form className="flex flex-col space-y-5">
          {mensagem && (
            <div
              className={`${success ? "text-red-600" : "text-green-600"} font-semibold text-sm text-center`}
            >
              {mensagem}
            </div>
          )}

          <div className="flex flex-col">
            <label className="text-gray-700 font-medium mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => limparEmail(e, setEmail)}
              type="email"
              placeholder="Digite seu email"
              className="bg-gray-100 border border-gray-300 rounded-lg h-11 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-gray-700 font-medium mb-1">
              Confirmar Email
            </label>
            <input
              value={confirmEmail}
              onChange={(e) => limparEmail(e, setConfirmEmail)}
              type="email"
              placeholder="Confirme seu email"
              className="bg-gray-100 border border-gray-300 rounded-lg h-11 px-4 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            type="button"
            className="w-full bg-cyan-600 text-white p-2 rounded-lg font-bold hover:bg-cyan-700"
            onClick={salvarEmail}
          >
            Salvar
          </button>
        </form>
      </div>
    </div>
  );
}

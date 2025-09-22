import { cadastrarUsuario } from "../../services/api";
import { useState } from "react";
import ModalSimNao from "../ModalSimNao";

export default function CreateUser({ onClose, mostrarPopup }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sector, setSector] = useState("");
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("");
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  const cancelarOperacao = () => {
    console.log("Operação Cancelada");
    setMostarModalSimNao(false);
  };

  const temCamposAlterados = () => {
    return (
      name.trim() !== "" ||
      email.trim() !== "" ||
      password.trim() !== "" ||
      position.trim() !== "" ||
      sector.trim() !== "" ||
      level !== ""
    );
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (name && email && sector && position && password && level) {
      const data = await cadastrarUsuario({
        name,
        email,
        password,
        sector,
        position,
        level: Number(level),
      });
      setMensagem(data.message);

      setPopup({
        mostrar: true,
        mensagem: data.message,
        tipo: data.success ? "success" : "error",
      });

      // Fecha o popup automaticamente depois de 3 segundos
      setTimeout(() => setPopup({ ...popup, mostrar: false }), 3000);

      if (data.success) {
        if (onClose) onClose();
      }
      setMostarModalSimNao(false);
      setName("");
      setEmail("");
      setPassword("");
      setPosition("");
      setSector("");
      setLevel("");
    } else {
      setPopup({
        mostrar: true,
        mensagem: "Favor preencher todos os campos obrigatórios.",
        tipo: "error",
      });
      setMostarModalSimNao(false);
      setTimeout(() => setPopup({ ...popup, mostrar: false }), 2000);
    }
  };

  return (
    <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-6 flex items-center mb-20">
      <div className="w-full">
        {/* Título do formulário */}

        <form onSubmit={handleCadastro} className="flex flex-wrap gap-5">
          <div className="flex flex-wrap w-full gap-4">
            <div className="flex-1 min-w-[425px]">
              <label
                htmlFor="nome"
                className="block text-sm font-semibold mb-1"
              >
                Nome:
              </label>
              <input
                type="text"
                id="nome"
                name="nome"
                maxLength={80}
                placeholder="Digite o nome completo"
                value={name}
                onChange={(e) => {
                  const somenteLetras = e.target.value.replace(
                    /[^a-zA-Z\s]/g,
                    ""
                  );
                  setName(somenteLetras);
                }}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 min-w-[450px]">
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1 "
              >
                E-mail:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                maxLength={80}
                placeholder="email@email.com.br"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex-1 max-w-[150px]">
            <label
              htmlFor="senha"
              className="flex flex-row text-sm font-semibold mb-1"
            >
              Senha:
            </label>
            <input
              type="password"
              id="password"
              name="password"
              maxLength={80}
              placeholder="Digite a sua senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex-1 min-w-[200px] w-full">
            <label htmlFor="cargo" className="block text-sm font-semibold mb-1">
              Cargo:
            </label>
            <input
              type="text"
              id="cargo"
              name="cargo"
              maxLength={50}
              value={position}
              onChange={(e) => {
                const somenteLetras = e.target.value.replace(
                  /[^a-zA-Z\s]/g,
                  ""
                );
                setPosition(somenteLetras);
              }}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          <div className="flex-1 min-w-[200px] w-full">
            <label htmlFor="setor" className="block text-sm font-semibold mb-1">
              Setor:
            </label>
            <select
              id="setor"
              name="setor"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione o setor</option>
              <option value="ROUPARIA">ROUPARIA</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] w-[20]">
            <label htmlFor="nivel" className="block text-sm font-semibold mb-1">
              Nível:
            </label>
            <select
              id="nivel"
              name="nivel"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
              className="w-[20] p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione uma opção</option>
              <option value="1">OPERADOR</option>
              <option value="2">SUPERVISOR</option>
            </select>
          </div>

          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-5 w-30 py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              onClick={() => {
                if (temCamposAlterados()) {
                  setMostarModalSimNao(true);
                } else {
                  setPopup({
                    mostrar: true,
                    mensagem: "Nenhum campo foi preenchido para cadastro",
                    tipo: "error",
                  });
                  setTimeout(
                    () => setPopup((prev) => ({ ...prev, mostrar: false })),
                    3000
                  );
                }
              }}
            >
              Cadastrar
            </button>
            <ModalSimNao
              mostrar={MostrarModalSimNao}
              onConfirmar={handleCadastro}
              onCancelar={cancelarOperacao}
              mensagem={"Deseja finalizar o cadastro do usuário?"}
            />
          </div>
        </form>

        {popup.mostrar && (
          <div
            className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-opacity duration-700 ease-in-out
            ${popup.tipo === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {popup.mensagem}
          </div>
        )}
      </div>
    </div>
  );
}

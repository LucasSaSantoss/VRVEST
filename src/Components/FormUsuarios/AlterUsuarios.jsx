import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alterarUsuario } from "../../services/api";
import ModalSimNao from "../ModalSimNao";
import { listarEspecialidades } from "../../services/api";
import { useEffect } from "react";

export default function AlterUser({ user, onClose, onUpdate, mostrarPopup }) {
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [password, setPassword] = useState(""); // começa vazio, só envia se preenchido
  const [position, setPosition] = useState(user?.position || "");
  const [sector, setSector] = useState(user?.sector || "");
  const [level, setLevel] = useState(user?.level || 1);
  const [active, setActive] = useState(user?.active || 1);
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [specialties, setSpecialties] = useState([]);

  const cancelarOperacao = () => {
    console.log("Operação Cancelada");
    setMostarModalSimNao(false);
  };

  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  useEffect(() => {
    const carregarEspecialidades = async () => {
      try {
        const resposta = await listarEspecialidades();
        if (resposta.success) {
          setSpecialties(resposta.data);
        } else {
          setPopup({
            mostrar: true,
            mensagem: "Erro ao carregar especialidades.",
            tipo: "error",
          });
        }
      } catch (err) {
        console.error("Erro ao buscar especialidades:", err);
        setPopup({
          mostrar: true,
          mensagem: "Falha na conexão ao buscar especialidades.",
          tipo: "error",
        });
      }
    };

    carregarEspecialidades();
  }, []);

  const limparTexto = (e, setState) => {
    let valor = e.target.value;
    valor = valor.replace(/[^a-zA-ZÀ-ú ]/g, "");
    valor = valor.replace(/\s+/g, " ");
    valor = valor.trimStart();
    valor = valor.replace(/(.)\1{2,}/g, "$1$1");
    valor = valor.toUpperCase();
    setState(valor);
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
    valor = valor.replace(/[^a-zA-ZÀ-ú@0-9._ ]/g, "");
    valor = valor.toLowerCase();
    setState(valor);
  };

  const validarEmail = (email) => {
    // Regex simples de validação de email
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setMostarModalSimNao(false);
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
    return re.test(email);
  };

  async function handleSubmit(e) {
    e.preventDefault();

    if (!user?.id) {
      mostrarPopup("Usuário não informado", "error");
      return;
    }

    if (!validarEmail(email)) {
      setPopup({ mostrar: true, mensagem: "E-mail inválido.", tipo: "error" });
      return;
    }

    const payload = {
      name,
      email,
      sector,
      position,
      level,
      active: Number(active),
      password: password || undefined,
    };

    // Só adiciona senha se preenchida
    if (password.trim() !== "") {
      payload.password = password;
    }

    // Validação de campos vazios
    if (!name || !email || !sector || !position || !level) {
      mostrarPopup("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {
      const res = await alterarUsuario(user.id, payload);

      mostrarPopup(
        res.message || "Alteração realizada",
        res.success ? "success" : "error"
      );

      if (res.success) {
        setMostarModalSimNao(false);
        if (onUpdate) await onUpdate();
        if (onClose) onClose();
      } else {
        setMostarModalSimNao(false);
        if (onClose) onClose();
      }
    } catch (err) {
      mostrarPopup("Não foi possível atualizar o usuário", "error");
      setMostarModalSimNao(false);
      console.error("Erro no handleSubmit:", err);
    }
  }

  return (
    <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-6 flex items-center mb-20">
      <div className="w-full">
        <form className="flex flex-wrap gap-5">
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
                maxLength={80}
                placeholder="Digite o nome completo"
                value={name}
                onChange={(e) => {
                  limparTexto(e, setName);
                }}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 min-w-[450px]">
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-1"
              >
                E-mail:
              </label>
              <input
                type="email"
                id="email"
                maxLength={80}
                placeholder="email@email.com.br"
                value={email}
                onChange={(e) => limparEmail(e, setEmail)}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="flex-1 max-w-[250px]">
            <label
              htmlFor="senha"
              className="flex flex-row text-sm font-semibold mb-1"
            >
              Senha:
            </label>
            <input
              type="password"
              id="password"
              minLength={6}
              maxLength={80}
              placeholder="Preencha para alterar a senha."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          {/* Cargo */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cargo" className="block text-sm font-semibold mb-1">
              Especialidade:
            </label>
            <select
              id="especialidade"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione a especialidade</option>
              {specialties.map((mod) => (
                <option key={mod.id} value={mod.name}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px] w-full">
            <label htmlFor="setor" className="block text-sm font-semibold mb-1">
              Setor:
            </label>
            <select
              id="setor"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione o setor</option>
              <option value="DP">D.P</option>
              <option value="RH">R.H</option>
              <option value="ROUPARIA">ROUPARIA</option>
              <option value="CENTRO DE ESTUDOS">CENTRO DE ESTUDOS</option>
              <option value="COORDENACAO ADMIN">COORD. ADMIN</option>
              <option value="DIRECAO">DIREÇÃO</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] w-[20]">
            <label htmlFor="nivel" className="block text-sm font-semibold mb-1">
              Nível:
            </label>
            <select
              id="nivel"
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione uma opção</option>
              <option value="1">OPERADOR</option>
              <option value="2">CONTROLADOR</option>
              <option value="3">DP</option>
              <option value="4">SUPERVISOR</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px] w-[20]">
            <label htmlFor="ativo" className="block text-sm font-semibold mb-1">
              Ativo:
            </label>
            <select
              id="ativo"
              value={active}
              onChange={(e) => setActive(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione uma opção</option>
              <option value="1">Ativo</option>
              <option value="2">Inativo</option>
            </select>
          </div>

          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-5 w-[150px] py-3 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              onClick={() => setMostarModalSimNao(true)}
            >
              Salvar Alterações
            </button>
            <ModalSimNao
              mostrar={MostrarModalSimNao}
              onConfirmar={handleSubmit}
              onCancelar={cancelarOperacao}
              mensagem={"Deseja finalizar o cadastro deste usuário?"}
            />
          </div>
        </form>

        {popup.mostrar && (
          <div
            className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg text-white font-semibold shadow-lg transition-opacity
            ${popup.tipo === "success" ? "bg-green-500" : "bg-red-500"}`}
          >
            {popup.mensagem}
          </div>
        )}
      </div>
    </div>
  );
}

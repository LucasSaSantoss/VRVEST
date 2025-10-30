import React, { useState, useEffect } from "react";
import {
  cadastrarFuncionario,
  listarModalidades,
  listarSetores,
} from "../../services/api";
import { useNavigate } from "react-router-dom";
import ModalSimNao from "../ModalSimNao";

export default function CreateFunc({ onClose }) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [sector, setSector] = useState("");
  const [modality, setModality] = useState("");
  const [matricula, setMatricula] = useState("");
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [mensagem, setMensagem] = useState("");
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });
  const [sectors, setSectors] = useState([]);
  const [mods, setMods] = useState([]);

  useEffect(() => {
    const carregarSetores = async () => {
      try {
        const resposta = await listarSetores();
        if (resposta.success) {
          setSectors(resposta.data);
        } else {
          setPopup({
            mostrar: true,
            mensagem: "Erro ao carregar setores.",
            tipo: "error",
          });
        }
      } catch (err) {
        console.error("Erro ao buscar setores:", err);
        setPopup({
          mostrar: true,
          mensagem: "Falha na conexão ao buscar setores.",
          tipo: "error",
        });
      }
    };

    carregarSetores();
  }, []);

  useEffect(() => {
    const carregarMods = async () => {
      try {
        const resposta = await listarModalidades();
        if (resposta.success) {
          setMods(resposta.data);
        } else {
          setPopup({
            mostrar: true,
            mensagem: "Erro ao carregar modalidades.",
            tipo: "error",
          });
        }
      } catch (err) {
        console.error("Erro ao buscar modalidades:", err);
        setPopup({
          mostrar: true,
          mensagem: "Falha na conexão ao buscar modalidades.",
          tipo: "error",
        });
      }
    };

    carregarMods();
  }, []);

  const cancelarOperacao = () => {
    console.log("Operação Cancelada");
    setMostarModalSimNao(false);
  };

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

  const temCamposAlterados = () => {
    return (
      name.trim() !== "" ||
      email.trim() !== "" ||
      cpf.trim() !== "" ||
      position.trim() !== "" ||
      sector.trim() !== "" ||
      modality.trim() !== ""
    );
  };

  const validarEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleCadastro = async (e) => {
    e.preventDefault();

    if (!name || !email || !cpf || !sector || !position || !modality) {
      setPopup({
        mostrar: true,
        mensagem: "Existem dados em branco, favor preencher.",
        tipo: "error",
      });
      setMostarModalSimNao(false);
      setTimeout(() => setPopup({ ...popup, mostrar: false }), 2000);
      return;
    }

    if (!validarEmail(email)) {
      setPopup({ mostrar: true, mensagem: "E-mail inválido.", tipo: "error" });
      return;
    }

    const data = await cadastrarFuncionario({
      name,
      cpf,
      email,
      sector,
      position,
      modality,
      matricula,
    });

    setMensagem(data.message);
    setPopup({
      mostrar: true,
      mensagem: data.message,
      tipo: data.success ? "success" : "error",
    });

    setTimeout(() => setPopup({ ...popup, mostrar: false }), 2000);

    if (data.success) {
      if (onClose) onClose();
      setName("");
      setEmail("");
      setCpf("");
      setPosition("");
      setSector("");
      setModality("");
      setMatricula("");
    }

    setMostarModalSimNao(false);
  };

  return (
    <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-6 flex items-center mb-20">
      <div className="w-full">
        <form className="flex flex-wrap gap-4">
          {/* Nome e Email */}
          <div className="flex flex-wrap w-full gap-2">
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
                value={name}
                onChange={(e) => limparTexto(e, setName)}
                maxLength={80}
                placeholder="Digite o nome completo"
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
                value={email}
                onChange={(e) => limparEmail(e, setEmail)}
                maxLength={80}
                placeholder="email@email.com.br"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Matrícula */}
          <div className="flex-1 min-w-[450px]">
            <label
              htmlFor="matricula"
              className="block text-sm font-semibold mb-1"
            >
              Matrícula:
            </label>
            <input
              type="text"
              id="matricula"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              maxLength={20}
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* CPF */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cpf" className="block text-sm font-semibold mb-1">
              CPF:
            </label>
            <input
              type="text"
              id="cpf"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              placeholder="Digite o CPF"
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Cargo */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="cargo" className="block text-sm font-semibold mb-1">
              Cargo:
            </label>
            <input
              type="text"
              id="cargo"
              value={position}
              onChange={(e) => limparTexto(e, setPosition)}
              maxLength={50}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Setor - dinâmico */}
          <div className="flex-1 min-w-[200px]">
            <label htmlFor="setor" className="block text-sm font-semibold mb-1">
              Setor:
            </label>
            <select
              id="setor"
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm bg-gray-50"
            >
              <option value="">Selecione o setor</option>
              {sectors.map((setor) => (
                <option key={setor.id} value={setor.name}>
                  {setor.name}
                </option>
              ))}
            </select>
          </div>

          {/* Modalidade */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="modalidade"
              className="block text-sm font-semibold mb-1"
            >
              Modalidade:
            </label>
            <select
              id="modalidade"
              value={modality}
              onChange={(e) => setModality(e.target.value)}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione a modalidade</option>
              {mods.map((mod) => (
                <option key={mod.id} value={mod.name}>
                  {mod.name}
                </option>
              ))}
            </select>
          </div>

          {/* Botão Cadastrar */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-5 w-30 py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              onClick={() => {
                if (temCamposAlterados()) {
                  if (!matricula && modality === "CLT") {
                    setPopup({
                      mostrar: true,
                      mensagem:
                        "Para colaboradores CLT, a matrícula é obrigatória.",
                      tipo: "error",
                    });
                  } else {
                    setMostarModalSimNao(true);
                  }
                } else {
                  setPopup({
                    mostrar: true,
                    mensagem: "Nenhum campo foi preenchido para cadastro",
                    tipo: "error",
                  });
                }
                setTimeout(
                  () => setPopup((prev) => ({ ...prev, mostrar: false })),
                  3000
                );
              }}
            >
              Cadastrar
            </button>

            <ModalSimNao
              mostrar={MostrarModalSimNao}
              onConfirmar={handleCadastro}
              onCancelar={cancelarOperacao}
              mensagem={`Deseja finalizar o cadastro do usuário ${name}?`}
            />
          </div>
        </form>

        {/* Popup */}
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

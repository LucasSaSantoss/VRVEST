import React, { useState, useEffect } from "react";
import { cadastrarFuncionario } from "../../services/api";
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
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const cancelarOperacao = () => {
    console.log("Operação Cancelada");
    setMostarModalSimNao(false);
  }; 

  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

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

  const payload = {
    name,
    email,
    cpf,
    sector,
    position,
    modality,
  };

  const validarEmail = (email) => {
    // Regex simples de validação de email
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setMostarModalSimNao(false);
    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
    return re.test(email);
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (
      !payload.name ||
      !payload.email ||
      !payload.cpf ||
      !payload.sector ||
      !payload.position ||
      !payload.modality
    ) {
      setMensagem("Existem dados em branco, favor preencher.");
      setPopup({
        mostrar: true,
        mensagem: "Existem dados em branco, favor preencher.",
        tipo: "error",
      });
      setTimeout(() => setPopup({ ...popup, mostrar: false }), 2000);
      setMostarModalSimNao(false);
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
      setName("");
      setEmail("");
      setCpf("");
      setPosition("");
      setSector("");
      setModality("");
    }
    setMostarModalSimNao(false);
  };

  return (
    <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-6 flex items-center mb-20">
      <div className="w-full">
        <form className="flex flex-wrap gap-4">
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

          {/* CPF */}
          <div className="flex-1 min-w-[200px] w-full">
            <label htmlFor="cpf" className="block text-sm font-semibold mb-1">
              CPF:
            </label>
            <input
              type="text"
              id="cpf"
              value={cpf}
              onChange={(e) => {
                const somenteNumeros = e.target.value.replace(/\D/g, "");
                setCpf(somenteNumeros);
              }}
              maxLength={11}
              placeholder="Digite o CPF"
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
            />
          </div>

          {/* Cargo */}
          <div className="flex-1 min-w-[200px] w-full">
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

          {/* Setor */}
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
              <option value="SALA AMARELA">SALA AMARELA</option>
              <option value="SALA VERMELHA">SALA VERMELHA</option>
              <option value="TRAUMA">TRAUMA</option>
              <option value="EMERGÊNCIA PEDIÁTRICA">
                EMERGÊNCIA PEDIÁTRICA
              </option>
              <option value="OBSERVAÇÃO PEDIÁTRICA">
                OBSERVAÇÃO PEDIÁTRICA
              </option>
              <option value="CENTRO CIRÚRGICO">CENTRO CIRÚRGICO</option>
              <option value="CLÍNICA MÉDICA">CLÍNICA MÉDICA</option>
              <option value="UI ADULTO">UI ADULTO</option>
              <option value="UTI ADULTO">UTI ADULTO</option>
              <option value="ORTOPEDIA">ORTOPEDIA</option>
              <option value="CIRURGIA GERAL">CIRURGIA GERAL</option>
              <option value="CETIPE">CETIPE</option>
              <option value="UTI NEONATAL">UTI NEONATAL</option>
              <option value="PEDIATRIA">PEDIATRIA</option>
              <option value="OBSTETRÍCIA">OBSTETRÍCIA</option>
            </select>
          </div>

          {/* Modalidade */}
          <div className="flex-1 min-w-[200px] w-full">
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
              <option value="PJ">PJ</option>
              <option value="CLT">CLT</option>
              <option value="RPA">RPA</option>
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

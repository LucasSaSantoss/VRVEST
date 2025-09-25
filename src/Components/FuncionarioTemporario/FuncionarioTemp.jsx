import React, { useState, useEffect } from "react";
import { cadastrarFuncionarioTemporario } from "../../services/api";
import { useNavigate } from "react-router-dom";
import ModalSimNao from "../ModalSimNao";

export default function CreateFuncTemp({}) {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [sector, setSector] = useState("");
  const [modality, setModality] = useState("");
  const [obs, setObs] = useState("");
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
    valor = valor.replace(/[^a-zA-ZÀ-ú ]/g, ""); // só letras e espaço
    valor = valor.replace(/\s+/g, " "); // remove espaços múltiplos
    valor = valor.trimStart(); // remove espaço no começo
    valor = valor.replace(/(.)\1{2,}/g, "$1$1");
    setState(valor);
  };

  const limparEmail = (e, setState) => {
    let valor = e.target.value;

    // Permite no máximo 1 @ → remove os extras
    const primeiraArroba = valor.indexOf("@");
    if (primeiraArroba !== -1) {
      // mantém só o primeiro @, remove os outros
      valor =
        valor.slice(0, primeiraArroba + 1) +
        valor.slice(primeiraArroba + 1).replace(/@/g, "");
    }
    valor = valor.replace(/\s+/g, " "); // remove espaços múltiplos
    valor = valor.trimStart(); // remove espaço no começo
    valor = valor.replace(/(.)\1{2,}/g, "$1$1");
    valor = valor.replace(/[^a-zA-ZÀ-ú@._ ]/g, ""); // só letras, @, ponto e espaço
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
    const data = await cadastrarFuncionarioTemporario({
      name,
      cpf,
      email,
      sector,
      position,
      modality,
      obs,
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
  };

  return (
    <div className="mt-[10vh] bg-gray-100 flex items-center justify-center">
      <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-8 shadow-lg w-full">
        {/* Título */}
        <h1 className="text-3xl font-bold text-center text-cyan-700 mb-8">
          Cadastro de Funcionário Temporário
        </h1>

        <form className="flex flex-wrap gap-4">
          <div className="flex flex-wrap w-full gap-2">
            {/* Nome */}
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
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            {/* Email */}
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
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
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
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
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
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
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
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
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
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            >
              <option value="">Selecione a modalidade</option>
              <option value="PJ">PJ</option>
              <option value="CLT">CLT</option>
              <option value="RPA">RPA</option>
            </select>
          </div>

          {/* Observação */}
          <div className="w-full">
            <label htmlFor="obs" className="block text-sm font-semibold mb-1">
              Observações:
            </label>
            <input
              type="text"
              id="obs"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              maxLength={200}
              required
              placeholder="Digite alguma observação (opcional)"
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Botão */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-6 py-2 mt-4 text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition text-sm font-semibold shadow-md"
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

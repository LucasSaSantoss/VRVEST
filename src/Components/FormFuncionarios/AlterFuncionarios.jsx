import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { alterarFuncionario } from "../../services/api";
import ModalSimNao from "../ModalSimNao";

export default function AlterForm({ employee, onClose, onUpdate }) {
  const navigate = useNavigate();

  const [name, setName] = useState(employee?.name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [cpf, setCpf] = useState(employee?.cpf || "");
  const [position, setPosition] = useState(employee?.position || "");
  const [sector, setSector] = useState(employee?.sector || "");
  const [modality, setModality] = useState(employee?.modality || "");
  const [active, setActive] = useState(employee?.active || 1);
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);

  const cancelarOperacao = () => {
    console.log("Operação Cancelada");
    setMostarModalSimNao(false);
  };

  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!employee?.id) {
      alert("Funcionário não informado");
      return;
    }

    const payload = {
      name,
      email,
      cpf,
      sector,
      position,
      modality,
      active: Number(active),
    };

    if (
      !name ||
      !email ||
      !cpf ||
      !sector ||
      !position ||
      !modality ||
      !active
    ) {
      console.log("Existem dados em branco.");
    }

    try {
      const res = await alterarFuncionario(employee.id, payload);

      setPopup({
        mostrar: true,
        mensagem: res.message || "Alteração realizada",
        tipo: res.success ? "success" : "error",
      });

      // Fecha automaticamente após 3 segundos
      setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);

      if (res.success) {
        if (onUpdate) await onUpdate();
        if (onClose) onClose();
      }
    } catch (err) {
      setPopup({
        mostrar: true,
        mensagem: "Erro ao atualizar funcionário",
        tipo: "error",
      });
      setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
      console.error("Erro no handleSubmit:", err);
    }
    setMostarModalSimNao(false);
  }

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
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setEmail(e.target.value)}
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
              onChange={(e) => setCpf(e.target.value)}
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
              onChange={(e) => setPosition(e.target.value)}
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

          {/* Ativo */}
          <div className="flex-1 max-w-[200px] w-full">
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
              <option value="1">Ativo</option>
              <option value="2">Inativo</option>
            </select>
          </div>

          {/* Botão */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-5 w-30 py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              onClick={() => setMostarModalSimNao(true)}
            >
              Salvar Alterações
            </button>
            <ModalSimNao
              mostrar={MostrarModalSimNao}
              onConfirmar={handleSubmit}
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

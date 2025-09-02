import React, { useState, useEffect } from "react";
import { cadastrarFuncionario } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function FormularioVRVest() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [sector, setSector] = useState("");
  const [modality, setModality] = useState("");

  const [mensagem, setMensagem] = useState("");

  const [usuarioLogado, setUsuarioLogado] = useState(null);

  // useEffect(() => {
  //   const usuarioString = localStorage.getItem("usuario");
  //   if (!usuarioString) {
  //     navigate("/");
  //     return;
  //   }
  //   try {
  //     const usuario = JSON.parse(usuarioString);
  //     setUsuarioLogado(usuario);
  //   } catch (err) {
  //     console.error("Erro ao ler usuário do localStorage:", err);
  //     navigate("/");
  //   }
  // }, [navigate]);

  const handleCadastro = async (e) => {
    e.preventDefault();
    if (!usuarioLogado) {
      setMensagem("Usuário não logado.");
      return;
    }

    const data = await cadastrarFuncionario({
      name,
      cpf,
      email,
      sector,
      position,
      cadUserID: usuarioLogado.id,
      cadUserName: usuarioLogado.name,
      modality,
    });

    setMensagem(data.message);

    if (data.success) {
      setName("");
      setEmail("");
      setCpf("");
      setPosition("");
      setSector("");
      setModality("");
    }
  };

  if (!usuarioLogado) return <p>Carregando usuário...</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-center mt-6 mb-6">
        Cadastro de Funcionários
      </h2>
      <div className="bg-white border-2 border-cyan-600 rounded-xl p-6 flex items-center mb-20">
        <div className="w-full">
          <form onSubmit={handleCadastro} className="flex flex-wrap gap-4">
            <div className="flex flex-wrap w-full gap-4">
              <div className="flex-1 min-w-[425px]">
                <label htmlFor="nome" className="block text-sm font-semibold mb-1">
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
                <label htmlFor="email" className="block text-sm font-semibold mb-1">
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
                <option value="EMERGÊNCIA PEDIÁTRICA">EMERGÊNCIA PEDIÁTRICA</option>
                <option value="OBSERVAÇÃO PEDIÁTRICA">OBSERVAÇÃO PEDIÁTRICA</option>
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
              <label htmlFor="modalidade" className="block text-sm font-semibold mb-1">
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

            {/* Botão */}
            <div className="w-full flex justify-center">
              <button
                type="submit"
                className="px-5 w-30 py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              >
                Enviar
              </button>
            </div>
          </form>

          {mensagem && (
            <p className="mt-4 text-center text-red-600 font-semibold">{mensagem}</p>
          )}
        </div>
      </div>
    </div>
  );
}

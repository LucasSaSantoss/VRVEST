import React from "react";
import { useState } from "react";
import axios from "axios";
import { cadastrarUsuario } from "../services/api";

export default function UserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sector, setSector] = useState("");
  const [position, setPosition] = useState("");
  const [level, setLevel] = useState("");

  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mensagem, setMensagem] = useState("");

  const handleCadastro = async (e) => {
    e.preventDefault();

    const data = await cadastrarUsuario({
      name,
      email,
      password,
      sector,
      position,
      level: parseInt(level),
    });
    setMensagem(data.message);

    if (data.success) {
      setName("");
      setEmail("");
      setPassword("");
      setLevel("");
      setPosition("");
      setSector("");
    }
  };

  return (
    <div>
      <section className="flex flex-row bg-[#2faed4] h-[35vh] items-center place-content-between">
        <div className="flex flex-col">
          <div className="flex items-center ml-8">
            <span className="flex justify-center items-center border-2 rounded-2xl text-4xl px-1 py-0.5 font-bold h-18 w-20">
              VR
            </span>
            <p className="flex text-7xl pl-2">VEST</p>
            <img
              className="imgViva h-[15vh] "
              src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
              alt="Logo Viva-Rio"
            />
          </div>
          <div className="text-left mt-5 ml-8">
            <h1 className="text-4xl font-bold text-gray-800">
              Sistema de Gestão de Vestes
            </h1>
            <p className="text-lg text-gray-600 mt-2">VERSÃO DE LANÇAMENTO</p>
          </div>
        </div>

        <img
          className="w-[23vw] h-[20vh] mr-10"
          src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
          alt="Logo Hmas"
        />
      </section>
      <h2 className="text-2xl font-bold text-center mt-6 mb-6">
        Cadastro de Usuários
      </h2>
      <div className="bg-white border-2 border-cyan-600 rounded-xl p-6 flex items-center mb-20">
        <div className="w-full">
          {/* Título do formulário */}

          <form onSubmit={handleCadastro} className="flex flex-wrap gap-4">
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
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
                />
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

            <div className="flex-1 min-w-[200px] w-full">
              <label
                htmlFor="cargo"
                className="block text-sm font-semibold mb-1"
              >
                Cargo:
              </label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                maxLength={50}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 min-w-[200px] w-full">
              <label
                htmlFor="setor"
                className="block text-sm font-semibold mb-1"
              >
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

            <div className="flex-1 min-w-[200px] w-[20]">
              <label
                htmlFor="nivel"
                className="block text-sm font-semibold mb-1"
              >
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
                <option value="1">1</option>
                <option value="2">2</option>
              </select>
            </div>

            {/* Botão */}
            <div className="w-full flex justify-center">
              <button
                type="submit"
                className="px-5 w-30 py-2 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              >
                Cadastrar
              </button>
             <alert>
              {mensagem && <p className="mt-3 text-center">{mensagem}</p>}
              </alert>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

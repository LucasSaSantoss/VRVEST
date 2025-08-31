import React from "react";
import axios from "axios";

export default function FormularioVRVest() {
  async function buscaDados() {
    try {
      const response = await axios.get("/usuario");
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

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
        Formulário de Cadastro
      </h2>
      <div className="bg-white border-2 border-cyan-600 rounded-xl p-6 flex items-center mb-20">
        <div className="w-full">
          {/* Título do formulário */}

          <form onSubmit={buscaDados} className="flex flex-wrap gap-4">
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
                name="numeroCpf"
                maxLength={11}
                placeholder="Digite o CPF"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Cargo */}
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
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Setor */}
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
                name="modalidade"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="PJ">PJ</option>
                <option value="CLT">CLT</option>
                <option value="RPA">RPA</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px] w-full">
              <label
                htmlFor="nivel"
                className="block text-sm font-semibold mb-1"
              >
                Nível:
              </label>
              <select
                id="nivel"
                name="nivel"
                required
                className="w-[10] p-2 mb-5 border border-gray-300 rounded-lg text-sm"
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
                Enviar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

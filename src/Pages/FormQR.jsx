import React from "react";
import axios from "axios";


export default function FormularioVRVest() {

  async function buscaDados() {
    try{
        const response = await axios.get('/usuario');
        console.log(response);      
    }catch(error){
      console.error(error);
    }
  };

  return (
      <div>
        <section className="flex flex-row bg-[#2faed4] items-center place-content-between">
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

        <div className="flex flex-col items-center justify-center">
          <h1 className="mt-5 mb-2 text-center text-2xl">
            Formulário de Cadastro
          </h1>

          <div className="bg-white border-2 border-cyan-600 rounded-xl p-8 flex justify-center items-center mb-20">
            <form
              action="submit_form.php"
              method="post"
              className="flex flex-col w-80"
              obSubmit = {buscaDados}
            >
              <label htmlFor="name" className="mb-1">
                Nome:
              </label>
              <input
                type="text"
                id="name"
                name="nome"
                maxLength={80}
                placeholder="Digite o nome completo"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
              />

              <label htmlFor="email" className="mb-1">
                E-mail:
              </label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="email@email.com.br"
                maxLength={80}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
              />

              <label htmlFor="cpf" className="mb-1">
                CPF:
              </label>
              <input
                type="text"
                id="cpf"
                name="numeroCpf"
                maxLength={11}
                placeholder="Digite o CPF"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
              />

              <label htmlFor="cargo" className="mb-1">
                Cargo:
              </label>
              <input
                type="text"
                id="cargo"
                name="cargo"
                maxLength={50}
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
              />

              <label htmlFor="setor" className="mb-1">
                Setor:
              </label>
              <select
                id="opcoes"
                name="opcoes"
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
                required
              >
                <option value="opcao1">SALA AMARELA</option>
                <option value="opcao2">SALA VERMELHA</option>
                <option value="opcao3">TRAUMA</option>
                <option value="opcao4">EMERGÊNCIA PEDIÁTRICA</option>
                <option value="opcao5">OBSERVAÇÃO PEDIÁTRICA</option>
                <option value="opcao6">CENTRO CIRÚRGICO</option>
                <option value="opcao7">CLÍNICA MÉDICA</option>
                <option value="opcao8">UI ADULTO</option>
                <option value="opcao9">UTI ADULTO</option>
                <option value="opcao10">ORTOPEDIA</option>
                <option value="opcao11">CIRURGIA GERAL</option>
                <option value="opcao12">CETIPE</option>
                <option value="opcao13">UTI NEONATAL</option>
                <option value="opcao14">PEDIATRIA</option>
                <option value="opcao15">OBSTETRÍCIA</option>

                
              </select>

              <label htmlFor="opcoes" className="mb-1">
                Modalidade:
              </label>
              <select
                id="opcoes"
                name="opcoes"
                className="w-full p-2 mb-5 border border-gray-300 rounded-md"
                required
              >
                <option value="opcao1">PJ</option>
                <option value="opcao2">CLT</option>
                <option value="opcao3">RPA</option>
                
              </select>

              <button
                type="submit"
                className="px-5 py-2 mt-5 text-white bg-blue-500 rounded-full hover:bg-blue-600 transition"
              >
                Enviar
              </button>
            </form>
          </div>
        </div>
      </div>
  );
}

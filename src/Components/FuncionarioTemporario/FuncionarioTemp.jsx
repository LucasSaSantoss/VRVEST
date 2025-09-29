import React, { useState } from "react";
import { cadastrarFuncionarioTemporario } from "../../services/api";
import { useNavigate } from "react-router-dom";
import ModalSimNao from "../ModalSimNao";
import SelfieWebcam from "../WebCam/SelfieWebCam";

export default function CreateFuncTemp() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [position, setPosition] = useState("");
  const [sector, setSector] = useState("");
  const [modality, setModality] = useState("");
  const [obs, setObs] = useState("");
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [popup, setPopup] = useState({
    mostrar: false,
    mensagem: "",
    tipo: "info",
  });
  const [showWebcamModal, setShowWebcamModal] = useState(false);
  const [avatarImage, setAvatarImage] = useState(null);

  const handleOpenWebcam = () => setShowWebcamModal(true);
  const handleCloseWebcam = () => setShowWebcamModal(false);
  const handlePhotoTaken = (file) => {
    setAvatarImage({
      file: file,
      preview: URL.createObjectURL(file), // cria URL para o preview
    });
    handleCloseWebcam();
  };
  const cancelarOperacao = () => setMostarModalSimNao(false);

  const limparTexto = (e, setState) => {
    let valor = e.target.value;
    valor = valor.replace(/[^a-zA-ZÀ-ú ]/g, "");
    valor = valor.replace(/\s+/g, " ");
    valor = valor.trimStart();
    valor = valor.replace(/(.)\1{2,}/g, "$1$1");
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
    valor = valor.replace(/(.)\1{2,}/g, "$1$1");
    valor = valor.replace(/[^a-zA-ZÀ-ú@0-9._ ]/g, "");
    setState(valor);
  };

  const temCamposAlterados = () => {
    return (
      name.trim() ||
      email.trim() ||
      cpf.trim() ||
      position.trim() ||
      sector.trim() ||
      modality.trim()
    ); /*|| avatarImage;*/
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

    if (!name || !email || !cpf || !position || !sector || !modality) {
      setPopup({
        mostrar: true,
        mensagem: "Existem dados em branco, favor preencher.",
        tipo: "error",
      });
      setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
      setMostarModalSimNao(false);
      return;
    }

    if (!validarEmail(email)) {
      setPopup({ mostrar: true, mensagem: "E-mail inválido.", tipo: "error" });
      return;
    }

    if (!avatarImage) {
      setPopup({
        mostrar: true,
        mensagem: "Favor preencher o campo imagem.",
        tipo: "error",
      });
      setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
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
      avatarImage,
    });

    setPopup({
      mostrar: true,
      mensagem: data.message,
      tipo: data.success ? "success" : "error",
    });

    if (data.success) {
      setMostarModalSimNao(false);
      setName("");
      setEmail("");
      setCpf("");
      setPosition("");
      setSector("");
      setModality("");
      setObs("");
      setAvatarImage(null);
    } else {
      setMostarModalSimNao(false);
    }

    setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 3000);
  };

  return (
    <div className="mt-[4vh] bg-gray-100 flex items-center justify-center">
      <div className="bg-white border-2 border-cyan-600 mx-auto max-w-[1500px] rounded-xl p-8 shadow-lg w-full">
        <h1 className="text-3xl font-bold text-center text-cyan-700 mb-8">
          Cadastro de Funcionário Temporário
        </h1>

        <form className="flex flex-wrap gap-4">
          {/* Foto */}
          <div className="w-full flex flex-col items-center gap-2">
            {avatarImage ? (
              <img
                src={avatarImage.preview} // aqui usa a URL de preview
                alt="Avatar Capturado"
                className="w-40 h-40 object-cover rounded-full border-4 border-cyan-500 shadow-lg"
              />
            ) : (
              <div className="w-40 h-40 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-dashed border-gray-400">
                Foto do Funcionário
              </div>
            )}
            <button
              type="button"
              onClick={handleOpenWebcam}
              className="px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 shadow-md transition"
            >
              {avatarImage ? "Registrar Nova Foto" : "Capturar Foto"}
            </button>
          </div>

          {/* Campos do formulário */}
          <div className="flex flex-wrap w-full gap-2">
            {/* Nome */}
            <div className="flex-1 min-w-[425px]">
              <label className="block text-sm font-semibold mb-1">Nome:</label>
              <input
                type="text"
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
              <label className="block text-sm font-semibold mb-1">
                E-mail:
              </label>
              <input
                type="email"
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
            <label className="block text-sm font-semibold mb-1">CPF:</label>
            <input
              type="text"
              value={cpf}
              onChange={(e) => setCpf(e.target.value.replace(/\D/g, ""))}
              maxLength={11}
              placeholder="Digite o CPF"
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Cargo */}
          <div className="flex-1 min-w-[200px] w-full">
            <label className="block text-sm font-semibold mb-1">Cargo:</label>
            <input
              type="text"
              value={position}
              onChange={(e) => limparTexto(e, setPosition)}
              maxLength={50}
              required
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Setor */}
          <div className="flex-1 min-w-[200px] w-full">
            <label className="block text-sm font-semibold mb-1">Setor:</label>
            <select
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
            <label className="block text-sm font-semibold mb-1">
              Modalidade:
            </label>
            <select
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

          {/* Observações */}
          <div className="w-full">
            <label className="block text-sm font-semibold mb-1">
              Observações:
            </label>
            <input
              type="text"
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              maxLength={200}
              placeholder="Digite alguma observação (opcional)"
              className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500"
            />
          </div>

          {/* Botões */}
          <div className="w-full flex justify-center gap-4">
            <button
              type="button"
              onClick={() =>
                temCamposAlterados()
                  ? setMostarModalSimNao(true)
                  : alert("Preencha algum campo")
              }
              className="px-6 py-2 text-white bg-cyan-600 rounded-lg hover:bg-cyan-700 transition"
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

        {/* Modal da Webcam sem fundo escuro */}
        {showWebcamModal && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="bg-white rounded-2xl p-6 shadow-2xl w-[600px] relative">
              <button
                onClick={handleCloseWebcam}
                className="absolute top-3 right-3 text-gray-600 hover:text-red-700 font-bold text-5xl text-red-500 "
              >
                &times;
              </button>
              <SelfieWebcam
                show={showWebcamModal}
                onUsePhoto={handlePhotoTaken}
                onClose={handleCloseWebcam}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

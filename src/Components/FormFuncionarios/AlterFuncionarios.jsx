import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  alterarFuncionario,
  listarSetores,
  listarModalidades,
  listarEspecialidades,
} from "../../services/api";
import ModalSimNao from "../ModalSimNao";

export default function AlterForm({
  employee,
  onClose,
  onUpdate,
  mostrarPopup,
}) {
  const navigate = useNavigate();

  const [name, setName] = useState(employee?.name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [cpf, setCpf] = useState(employee?.cpf || "");
  const [position, setPosition] = useState(employee?.position || "");
  const [sector, setSector] = useState(employee?.sector || "");
  const [modality, setModality] = useState(employee?.modality || "");
  const [matricula, setMatricula] = useState(employee?.matricula || "");
  const [active, setActive] = useState(employee?.active || 1);
  const [MostrarModalSimNao, setMostarModalSimNao] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [mods, setMods] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  // const [inicioEstudos, setInicioEstudos] = useState(new Date());
  // const [fimEstudos, setFimEstudos] = useState(new Date());

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

  async function handleSubmit(e) {
    e.preventDefault();

    if (!employee?.id) {
      mostrarPopup("Colaborador não informado", "error");
      return;
    }

    const payload = {
      name,
      email,
      cpf,
      sector,
      position,
      modality,
      matricula,
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
      setMostarModalSimNao(false);
      setPopup({
        mostrar: true,
        mensagem: "Preencha todos os campos obrigatórios.",
        tipo: "error",
      });
      setTimeout(() => setPopup((prev) => ({ ...prev, mostrar: false })), 2000);
      mostrarPopup("Preencha todos os campos obrigatórios.", "error");
      return;
    }

    try {
      const res = await alterarFuncionario(employee.id, payload);

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
      mostrarPopup(
        "Não foi possível atualizar o registro do colaborador.",
        "error"
      );
      setMostarModalSimNao(false);
      console.error("Erro no handleSubmit:", err);
    }
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
                onChange={(e) => {
                  limparTexto(e, setName);
                }}
                maxLength={80}
                placeholder="Digite o nome completo"
                required
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            <div className="flex-1 max-w-[450px]">
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
            {/* CPF */}
            <div className="flex-1 max-w-[200px]">
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
          </div>
          <div className="flex flex-wrap gap-5">
            <div className="flex-1 min-w-[200px] w-full">
              <label htmlFor="cpf" className="block text-sm font-semibold mb-1">
                Matrícula:
              </label>
              <input
                type="text"
                id="matricula"
                value={matricula}
                onChange={(e) => {
                  const somenteNumeros = e.target.value.toUpperCase();
                  setMatricula(somenteNumeros);
                }}
                maxLength={20}
                className="w-full p-2 mb-5 border border-gray-300 rounded-lg text-sm"
              />
            </div>

            {/* Cargo */}
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="cargo"
                className="block text-sm font-semibold mb-1"
              >
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

            {/* Setor */}
            <div className="flex-1 min-w-[200px]">
              <label
                htmlFor="setor"
                className="block text-sm font-semibold mb-1"
              >
                Setor:
              </label>
              <select
                id="setor"
                value={sector}
                onChange={(e) => {
                  setSector(e.target.value);
                  e.target.value === "TRAUMA"
                    ? setShowKitTrauma(true)
                    : setShowKitTrauma(false);
                }}
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

            {/* Ativo */}
            <div className="flex-1 max-w-[200px] w-full">
              <label
                htmlFor="ativo"
                className="block text-sm font-semibold mb-1"
              >
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
          </div>

          {/* <div
            className={`${modality !== "PJ" && modality !== "CLT" && modality !== "RPA" ? "visible" : "invisible"} grid grid-cols-2 gap-10`}
          >
            <div>
              <label className={`flex max-w-[100px]`}>Data de Início</label>
              <input
                type="Date"
                id="dataInicio"
                value={inicioEstudos}
                onChange={(e) => {
                  setInicioEstudos(e.target.value);
                }}
                maxLength={50}
                required
                className={`p-2 mb-5 border border-gray-300 rounded-lg text-sm`}
              />
            </div>

            <div>
              <label className={` flex max-w-[100px]`}>Data Fim</label>
              <input
                type="Date"
                id="dataFim"
                value={fimEstudos}
                onChange={(e) => {
                  setFimEstudos(e.target.value);
                }}
                maxLength={50}
                required
                className={` max-w-[150px] p-2 mb-5 border border-gray-300 rounded-lg text-sm`}
              />
            </div>
          </div> */}
          {/* Botão */}
          <div className="w-full flex justify-center">
            <button
              type="button"
              className="px-5 w-[150px] py-3 mt-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition text-sm"
              onClick={() => {
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
                setTimeout(
                  () => setPopup((prev) => ({ ...prev, mostrar: false })),
                  3000
                );
              }}
            >
              Salvar Alterações
            </button>
            <ModalSimNao
              mostrar={MostrarModalSimNao}
              onConfirmar={handleSubmit}
              onCancelar={cancelarOperacao}
              mensagem={
                name
                  ? `Deseja finalizar as alterações no cadastro do colaborador ${name}?`
                  : "Deseja finalizar as alterações no cadastro do colaborador?"
              }
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

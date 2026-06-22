import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRef } from "react";
import { jwtDecode } from "jwt-decode";
import {
  LuLayoutGrid,
  LuClipboardList,
  LuQrCode,
  LuUserCog,
  LuShirt,
  LuChevronDown,
  LuChevronUp,
} from "react-icons/lu";
import {
  FaHospitalUser,
  FaArrowRight,
  FaArrowLeft,
  FaBusinessTime,
} from "react-icons/fa";
import { HiOutlineReceiptTax } from "react-icons/hi";
import { CgLogOff } from "react-icons/cg";
import { FaUserGear } from "react-icons/fa6";

import DashBoardVRVest from "../Components/DashboardComponents/DashboardScreen";
import RelatorioFinanceiroAtrasados from "../Components/Relatorios/RelatorioFinanceiroAtrasados";
import RelatorioRetiradasUniformes from "../Components/Relatorios/RelatorioRetiradasUniformes";
import RelatorioEmprestimosUniformes from "../Components/Relatorios/RelatorioEmprestimosUniformes";
import RelatorioVencimentosUniformes from "../Components/Relatorios/RelatorioVencimentosUniformes";
import RelatorioEstoqueUniformes from "../Components/Relatorios/RelatorioEstoqueUniformes";
import QrCodeVRVest from "../Components/QrCodeVRVest";
import TabelaUsuarios from "../Components/FormUsuarios/FormUsuarios";
import HeaderQRCode from "../Components/HeaderQRCode";
import TabelaFuncionarios from "../Components/FormFuncionarios/FormFuncionarios";
import ListaPendencias from "../Components/BaixaFinanc/BaixaFinanceira";
import CreateFuncTemp from "../Components/FuncionarioTemporario/FuncionarioTemp";
import ProfileContainer from "../Components/ProfileTabs/ProfileScreen";
import EntradaEstoqueUniformes from "../Components/Uniformes/EntradaEstoqueUniformes";
import CautelasLegadasUniformes from "../Components/Uniformes/CautelasLegadasUniformes";
import RetiradaUniformes from "../Components/Uniformes/RetiradaUniformes";
import CadastroUniformes from "../Components/Uniformes/CadastroUniformes";
import BaixaDpUniformes from "../Components/Uniformes/BaixaDpUniformes";
import DevolucaoUniformes from "../Components/Uniformes/DevolucaoUniformes";
import EmprestimoUniformes from "../Components/Uniformes/EmprestimoUniformes";
import DevolucaoEmprestimos from "../Components/Uniformes/DevolucaoEmprestimos";

const UNIFORMES_RELEASE_MODE = String(
  import.meta.env.VITE_UNIFORMES_FASE_LIBERACAO || "BY_PROFILE"
).toUpperCase();

const isUniformesAdminOnly = () => UNIFORMES_RELEASE_MODE === "ADMIN_ONLY";

const PERFIL_OPERADOR = 1;
const PERFIL_CONTROLADOR = 2;
const PERFIL_DP = 3;
const PERFIL_SUPERVISOR = 4;

const isUniformesTab = (tab) =>
  [
    "retiradaUniformes",
    "devolucaoUniformes",
    "emprestimoUniformes",
    "devolucaoEmprestimos",
    "baixaDpUniformes",
    "cadastroUniformes",
    "estoqueUniformes",
    "cautelasLegadasUniformes",
    "relatorioRetiradasUniformes",
    "relatorioEmprestimosUniformes",
    "relatorioVencimentosUniformes",
    "relatorioEstoqueUniformes",
  ].includes(tab);

const canAccessTabByLevel = (level, tab) => {
  const userLevel = Number(level || 0);
  // [MANUTENCAO] Motivo: habilitar implantação controlada dos módulos novos de uniformes.
  // [MANUTENCAO] Impacto: em ADMIN_ONLY, frontend oculta acessos para não-supervisor mantendo backend como proteção final.
  // [MANUTENCAO] Data: 2026-05-29
  // [MANUTENCAO] Autor: Márlon Etiene
  if (isUniformesAdminOnly() && isUniformesTab(tab)) {
    return userLevel === PERFIL_SUPERVISOR;
  }

  const isOperador = userLevel === PERFIL_OPERADOR;
  const isControlador = userLevel === PERFIL_CONTROLADOR;
  const isDp = userLevel === PERFIL_DP;
  const isSupervisor = userLevel === PERFIL_SUPERVISOR;

  switch (tab) {
    case "home":
      return userLevel >= 4;
    case "qrcode":
      return userLevel === 1 || userLevel >= 4;
    case "usuarios":
      return userLevel > 3;
    case "funcionarios":
      return userLevel >= 2;
    case "funcionarioTemp":
      return userLevel !== 2;
    case "retiradaUniformes":
    case "devolucaoUniformes":
    case "emprestimoUniformes":
    case "devolucaoEmprestimos":
      return isOperador || isSupervisor;
    case "baixaDpUniformes":
      return isDp || isSupervisor;
    case "cautelasLegadasUniformes":
      return userLevel >= PERFIL_OPERADOR;
    case "cadastroUniformes":
    case "estoqueUniformes":
    case "relatorioEstoqueUniformes":
      return isControlador || isSupervisor;
    case "baixa":
    case "relatorios":
    case "relatorioRetiradasUniformes":
    case "relatorioEmprestimosUniformes":
    case "relatorioVencimentosUniformes":
      return isSupervisor;
    case "perfil":
      return true;
    default:
      return false;
  }
};

const getDefaultTabByLevel = (level) => {
  const userLevel = Number(level || 0);

  switch (userLevel) {
    case PERFIL_SUPERVISOR:
      return "home";
    case PERFIL_DP:
    case PERFIL_CONTROLADOR:
      return "funcionarios";
    case PERFIL_OPERADOR:
      return "qrcode";
    default:
      return "home";
  }
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState("");
  const [locked, setLocked] = useState(false);
  const [levelUser, setLevelUser] = useState(0);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [submenuUniformesOpen, setSubmenuUniformesOpen] = useState(false);
  const [userName, setUserName] = useState("");
  const lastUniformButtonClickRef = useRef(new WeakMap());
  const sidebarExpanded = hovered || locked;

  let timeoutId;

  const handleMouseEnter = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setHovered(true), 200);
  };

  const handleMouseLeave = () => {
    if (!locked) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setHovered(false), 200);
    }
  };

  const handleToggleLock = () => {
    if (locked) {
      setLocked(false);
      setHovered(false);
    } else {
      setLocked(true);
    }
  };

  // [MANUTENCAO] Motivo: manter estado da aba selecionada sincronizado com URL para facilitar navegação e compartilhamento.
  // [MANUTENCAO] Impacto: URL passa a refletir módulo ativo usando query param (?tab=...).
  // [MANUTENCAO] Data: 2026-05-19
  // [MANUTENCAO] Autor: Márlon Etiene
  const selectTab = (tab) => {
    setSelected(tab);
    setSearchParams((prev) => {
      const params = new URLSearchParams(prev);
      params.set("tab", tab);
      return params;
    });
  };

  const pages = useMemo(
    () => ({
      home: <DashBoardVRVest />,
      relatorios: <RelatorioFinanceiroAtrasados />,
      relatorioRetiradasUniformes: <RelatorioRetiradasUniformes />,
      relatorioEmprestimosUniformes: <RelatorioEmprestimosUniformes />,
      relatorioVencimentosUniformes: <RelatorioVencimentosUniformes />,
      relatorioEstoqueUniformes: <RelatorioEstoqueUniformes />,
      qrcode: <QrCodeVRVest />,
      funcionarioTemp: <CreateFuncTemp />,
      usuarios: <TabelaUsuarios />,
      funcionarios: <TabelaFuncionarios />,
      baixa: <ListaPendencias />,
      perfil: <ProfileContainer />,
      estoqueUniformes: <EntradaEstoqueUniformes />,
      cautelasLegadasUniformes: <CautelasLegadasUniformes />,
      retiradaUniformes: <RetiradaUniformes />,
      devolucaoUniformes: <DevolucaoUniformes />,
      emprestimoUniformes: <EmprestimoUniformes />,
      devolucaoEmprestimos: <DevolucaoEmprestimos />,
      cadastroUniformes: <CadastroUniformes />,
      baixaDpUniformes: <BaixaDpUniformes />,
    }),
    []
  );

  const showTemporaryPopup = (msg) => {
    setPopupMessage(msg);
    setShowPopup(true);
    setTimeout(() => setShowPopup(false), 3000);
  };

  useEffect(() => {
    const validarToken = () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/");
        return;
      }

      try {
        const decodedToken = jwtDecode(token);
        const agora = Date.now() / 1000;
        if (decodedToken.exp < agora) {
          localStorage.removeItem("token");
          showTemporaryPopup("Sua sessão expirou, faça login novamente.");
          setTimeout(() => navigate("/"), 3000);
        } else {
          // [MANUTENCAO] Motivo: normalizar o nível do token antes das regras de menu do módulo de uniformes.
          // [MANUTENCAO] Impacto: evita bloqueio visual quando o JWT entrega level como texto.
          // [MANUTENCAO] Data: 2026-06-05
          // [MANUTENCAO] Autor: Márlon Etiene
          const nivel = Number(decodedToken.level || 0);
          console.log(nivel);
          setLevelUser(nivel);
          setUserName(decodedToken.name || decodedToken.username || "Usuário");
          const requestedTab = searchParams.get("tab");
          const hasRequestedTab =
            requestedTab && Object.prototype.hasOwnProperty.call(pages, requestedTab);

          const defaultTab = getDefaultTabByLevel(nivel);

          const initialTab = hasRequestedTab ? requestedTab : defaultTab;
          const allowedInitialTab = canAccessTabByLevel(nivel, initialTab)
            ? initialTab
            : defaultTab;
          setSelected(allowedInitialTab);

          if (!hasRequestedTab || !canAccessTabByLevel(nivel, initialTab)) {
            setSearchParams((prev) => {
              const params = new URLSearchParams(prev);
              params.set("tab", defaultTab);
              return params;
            });
          }
        }
      } catch (err) {
        console.error("Erro ao verificar token:", err);
        localStorage.removeItem("token");
        showTemporaryPopup("Token inválido, faça login novamente.");
        navigate("/");
      }
    };

    validarToken();
    const intervalo = setInterval(validarToken, 60 * 1000);
    return () => clearInterval(intervalo);
  }, [navigate, pages, searchParams, setSearchParams]);

  const handleLogoff = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // [MANUTENCAO] Motivo: impedir duplo clique antes de o estado visual desabilitar botões dos módulos novos.
  // [MANUTENCAO] Impacto: descarta apenas o segundo clique no mesmo botão em intervalo inferior a 800 ms.
  // [MANUTENCAO] Data: 2026-06-22
  // [MANUTENCAO] Autor: Márlon Etiene
  const bloquearDuploCliqueUniformes = (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled) return;

    const now = Date.now();
    const lastClick = lastUniformButtonClickRef.current.get(button) || 0;
    if (now - lastClick < 800) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    lastUniformButtonClickRef.current.set(button, now);
  };

  return (
    <>
      <HeaderQRCode />

      <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside
          className={`fixed top-[100px] left-0  shadow-lg z-30 flex flex-col justify-between items-center text-white bg-[#16607a]
         ${sidebarExpanded ? "w-14 md:w-64" : "w-14 md:w-16"}
         h-[calc(100vh-95px)] transition-all duration-300 rounded-tr-2xl `}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Toggle */}
          <div className="p-2 sm:p-4 flex justify-center items-center border-b border-white/20 w-full">
            <button
              className="flex items-center hover:opacity-70 text-white"
              onClick={handleToggleLock}
            >
              <span className="text-lg sm:text-md rounded-full">
                {locked ? <FaArrowLeft /> : <FaArrowRight />}
              </span>
              <span
                className={`ml-2 text-sm sm:text-base ${hovered ? "opacity-100" : "hidden"}`}
              >
                {locked ? "Ocultar Menu" : "Fixar Menu"}
              </span>
            </button>
          </div>

          {/* Menu principal */}
          <ul
            className={`p-2 sm:p-3 space-y-1 flex-1 w-full overflow-y-auto overflow-x-hidden
              scrollbar-thin scrollbar-thumb-slate-500/70 scrollbar-track-transparent
              ${sidebarExpanded ? "pr-1" : "pr-0 scrollbar-thumb-transparent"}`}
            style={sidebarExpanded ? { scrollbarGutter: "stable" } : undefined}
          >
            {levelUser >= 4 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded 
                transition-colors duration-200 ${
                  selected === "home"
                    ? "bg-white text-gray-800"
                    : "hover:bg-white hover:text-gray-800"
                }`}
                onClick={() => selectTab("home")}
              >
                <LuLayoutGrid className="text-xl" />
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Dashboard
                </span>
              </li>
            )}

            {(levelUser === 1 || levelUser >= 4) && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "qrcode" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => selectTab("qrcode")}
              >
                <LuQrCode className="text-xl" />
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  QR Code
                </span>
              </li>
            )}

            {levelUser > 3 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "usuarios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => selectTab("usuarios")}
              >
                <LuUserCog className="text-xl" />
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Usuários
                </span>
              </li>
            )}

            {levelUser >= 2 && (
              <>
                <li
                  className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                  ${selected === "funcionarios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                  onClick={() => selectTab("funcionarios")}
                >
                  <FaHospitalUser className="text-xl" />
                  <span
                    className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
                  >
                    Colaboradores
                  </span>
                </li>
              </>
            )}

            {levelUser !== 2 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                  ${selected === "funcionarioTemp" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => selectTab("funcionarioTemp")}
              >
                <FaBusinessTime className="text-xl" />
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Colaborador Temporário
                </span>
              </li>
            )}
            {isUniformesTab(selected) ||
            [
              "retiradaUniformes",
              "devolucaoUniformes",
              "emprestimoUniformes",
              "devolucaoEmprestimos",
              "baixaDpUniformes",
              "cadastroUniformes",
              "estoqueUniformes",
              "cautelasLegadasUniformes",
              "relatorioEstoqueUniformes",
            ].some((tab) => canAccessTabByLevel(levelUser, tab)) ? (
              <li className="px-2.5 mt-2">
                <div
                  className="flex items-center justify-between cursor-pointer py-2 rounded transition-colors duration-200 hover:bg-white hover:text-gray-800"
                  onClick={() => setSubmenuUniformesOpen(!submenuUniformesOpen)}
                >
                  <div className="flex items-center">
                    <LuShirt className="text-xl" />
                    <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                      Uniformes
                    </span>
                  </div>
                  {hovered && (
                    <span className="text-sm">
                      {submenuUniformesOpen ? <LuChevronUp /> : <LuChevronDown />}
                    </span>
                  )}
                </div>
                {submenuUniformesOpen && hovered && (
                  <ul className="ml-6 mt-1 space-y-1 text-sm overflow-y-auto">
                    {canAccessTabByLevel(levelUser, "cadastroUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("cadastroUniformes")}>Cadastro de Uniformes</li>
                    )}
                    {(canAccessTabByLevel(levelUser, "cadastroUniformes") ||
                      canAccessTabByLevel(levelUser, "estoqueUniformes")) && (
                      <li className="my-1 border-t border-white/30" />
                    )}                    
                    {canAccessTabByLevel(levelUser, "estoqueUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("estoqueUniformes")}>Estoque de Uniformes</li>
                    )}
                    {canAccessTabByLevel(levelUser, "cautelasLegadasUniformes") && (
                      <li className="my-1 border-t border-white/30" />
                    )}                    
                    {canAccessTabByLevel(levelUser, "cautelasLegadasUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("cautelasLegadasUniformes")}>Consulta Cautelas Históricas</li>
                    )}
                    {(canAccessTabByLevel(levelUser, "cadastroUniformes") ||
                      canAccessTabByLevel(levelUser, "estoqueUniformes") ||
                      canAccessTabByLevel(levelUser, "cautelasLegadasUniformes")) && (
                      <li className="my-1 border-t border-white/30" />
                    )}
                    {canAccessTabByLevel(levelUser, "retiradaUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("retiradaUniformes")}>Retirada de Uniformes</li>
                    )}
                    {canAccessTabByLevel(levelUser, "devolucaoUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("devolucaoUniformes")}>Devolução de Uniformes</li>
                    )}
                    {(canAccessTabByLevel(levelUser, "retiradaUniformes") ||
                      canAccessTabByLevel(levelUser, "devolucaoUniformes")) && (
                      <li className="my-1 border-t border-white/30" />
                    )}
                    {canAccessTabByLevel(levelUser, "emprestimoUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("emprestimoUniformes")}>Empréstimo de Uniformes</li>
                    )}
                    {canAccessTabByLevel(levelUser, "devolucaoEmprestimos") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("devolucaoEmprestimos")}>Devolução de Empréstimos</li>
                    )}
                    {(canAccessTabByLevel(levelUser, "emprestimoUniformes") ||
                      canAccessTabByLevel(levelUser, "devolucaoEmprestimos")) && (
                      <li className="my-1 border-t border-white/30" />
                    )}
                    {canAccessTabByLevel(levelUser, "baixaDpUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("baixaDpUniformes")}>Baixa de Uniformes - DP</li>
                    )}
                    {canAccessTabByLevel(levelUser, "baixaDpUniformes") && (
                      <li className="my-1 border-t border-white/30" />
                    )}
                    {canAccessTabByLevel(levelUser, "relatorioEstoqueUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("relatorioEstoqueUniformes")}>Relatório de Estoque</li>
                    )}
                  </ul>
                )}
              </li>
            ) : null}
            {levelUser >= 4 && (
              <>
                <li
                  className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                  ${selected === "baixa" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                  onClick={() => selectTab("baixa")}
                >
                  <HiOutlineReceiptTax className="text-xl" />
                  <span
                    className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
                  >
                    Baixa Financeira
                  </span>
                </li>

                {/* Submenu Relatórios */}
                <li className="px-2.5 mt-2">
                  <div
                    className={`flex items-center justify-between cursor-pointer py-2 rounded transition-colors duration-200 ${
                      submenuOpen
                        ? "hover:bg-white hover:text-gray-800"
                        : "hover:bg-white hover:text-gray-800"
                    }`}
                    onClick={() => setSubmenuOpen(!submenuOpen)}
                  >
                    <div className="flex items-center">
                      <LuClipboardList className="text-xl" />
                      <span
                        className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
                      >
                        Relatórios
                      </span>
                    </div>
                    {hovered && (
                      <span className="text-sm">
                        {submenuOpen ? <LuChevronUp /> : <LuChevronDown />}
                      </span>
                    )}
                  </div>
                  {submenuOpen && hovered && (
                    <ul className="ml-6 mt-1 space-y-1 text-sm overflow-y-auto">
                      <li
                        className="cursor-pointer hover:text-gray-300"
                        onClick={() => selectTab("relatorios")}
                      >
                        Relatório de Pendências
                      </li>

                      <li className="my-1 border-2 border-t border-white/30" />
                      <li
                        className="cursor-pointer hover:text-gray-300"
                        onClick={() => selectTab("relatorioRetiradasUniformes")}
                      >
                        Retiradas de Uniformes
                      </li>
                      <li
                        className="cursor-pointer hover:text-gray-300"
                        onClick={() => selectTab("relatorioEmprestimosUniformes")}
                      >
                        Empréstimos de Uniformes
                      </li>
                      <li
                        className="cursor-pointer hover:text-gray-300"
                        onClick={() => selectTab("relatorioVencimentosUniformes")}
                      >
                        Vencimentos de Uniformes
                      </li>

                      <li
                        className="cursor-pointer hover:text-gray-300"
                        onClick={() => selectTab("relatorioEstoqueUniformes")}
                      >
                        Estoque de Uniformes
                      </li>
                    </ul>
                  )}
                </li>
              </>
            )}
          </ul>

          {/* Perfil + Logoff */}
          <div className="w-full">
            <div
              className="p-3 border-t border-white/20 flex items-center cursor-pointer hover:text-green-400"
              onClick={() => selectTab("perfil")}
            >
              <FaUserGear className="text-xl" />
              <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                {userName}
              </span>
            </div>
            <div
              className="p-3 border-t border-white/20 flex items-center cursor-pointer hover:text-red-400"
              onClick={handleLogoff}
            >
              <CgLogOff className="text-xl" />
              <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                Log Off
              </span>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main
          onClickCapture={
            isUniformesTab(selected) ? bloquearDuploCliqueUniformes : undefined
          }
          className={`flex-1 p-3 sm:p-5 md:p-6 lg:p-5 transition-all duration-300 overflow-y-auto mt-[110px] ml-[56px] ${
            sidebarExpanded ? "md:ml-[256px]" : "md:ml-[64px]"
          }`}
        >
          {pages[selected]}
        </main>

        {/* Popup */}
        {showPopup && (
          <div className="fixed bottom-5 right-5 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            {popupMessage}
          </div>
        )}
      </div>
    </>
  );
}


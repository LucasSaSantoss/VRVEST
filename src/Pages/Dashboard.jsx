import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  LuLayoutGrid,
  LuClipboardList,
  LuQrCode,
  LuUserCog,
  LuShirt,
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
import QrCodeVRVest from "../Components/QrCodeVRVest";
import TabelaUsuarios from "../Components/FormUsuarios/FormUsuarios";
import HeaderQRCode from "../Components/HeaderQRCode";
import TabelaFuncionarios from "../Components/FormFuncionarios/FormFuncionarios";
import ListaPendencias from "../Components/BaixaFinanc/BaixaFinanceira";
import CreateFuncTemp from "../Components/FuncionarioTemporario/FuncionarioTemp";
import ProfileContainer from "../Components/ProfileTabs/ProfileScreen";
import EntradaEstoqueUniformes from "../Components/Uniformes/EntradaEstoqueUniformes";
import RetiradaUniformes from "../Components/Uniformes/RetiradaUniformes";
import CadastroUniformes from "../Components/Uniformes/CadastroUniformes";
import BaixaDpUniformes from "../Components/Uniformes/BaixaDpUniformes";
import DevolucaoUniformes from "../Components/Uniformes/DevolucaoUniformes";
import EmprestimoUniformes from "../Components/Uniformes/EmprestimoUniformes";
import DevolucaoEmprestimos from "../Components/Uniformes/DevolucaoEmprestimos";

const canAccessTabByLevel = (level, tab) => {
  const userLevel = Number(level || 0);
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
      return userLevel >= 3; // operador e admin
    case "baixaDpUniformes":
      return userLevel === 2 || userLevel >= 4; // RH e admin
    case "cadastroUniformes":
    case "estoqueUniformes":
    case "baixa":
    case "relatorios":
    case "relatorioRetiradasUniformes":
    case "relatorioEmprestimosUniformes":
      return userLevel >= 4;
    case "perfil":
      return true;
    default:
      return false;
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
      qrcode: <QrCodeVRVest />,
      funcionarioTemp: <CreateFuncTemp />,
      usuarios: <TabelaUsuarios />,
      funcionarios: <TabelaFuncionarios />,
      baixa: <ListaPendencias />,
      perfil: <ProfileContainer />,
      estoqueUniformes: <EntradaEstoqueUniformes />,
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
          const nivel = decodedToken.level;
          console.log(nivel);
          setLevelUser(nivel);
          setUserName(decodedToken.name || decodedToken.username || "Usuário");
          const requestedTab = searchParams.get("tab");
          const hasRequestedTab =
            requestedTab && Object.prototype.hasOwnProperty.call(pages, requestedTab);

          const defaultTab = (() => {
            switch (nivel) {
              case 4:
                return "home";
              case 3:
                return "funcionarios";
              case 2:
                return "funcionarios";
              case 1:
                return "qrcode";
              default:
                return "home";
            }
          })();

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
            {(levelUser >= 3 || levelUser === 2) && (
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
                    <span className="text-sm">{submenuUniformesOpen ? "▲" : "▼"}</span>
                  )}
                </div>
                {submenuUniformesOpen && hovered && (
                  <ul className="ml-6 mt-1 space-y-1 text-sm overflow-y-auto">
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
                    {canAccessTabByLevel(levelUser, "cadastroUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("cadastroUniformes")}>Cadastro de Uniformes</li>
                    )}
                    {canAccessTabByLevel(levelUser, "cadastroUniformes") && (
                      <li className="my-1 border-t border-white/30" />
                    )}
                    {canAccessTabByLevel(levelUser, "estoqueUniformes") && (
                      <li className="cursor-pointer hover:text-gray-300" onClick={() => selectTab("estoqueUniformes")}>Estoque de Uniformes</li>
                    )}
                  </ul>
                )}
              </li>
            )}
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
                      <span className="text-sm">{submenuOpen ? "▲" : "▼"}</span>
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

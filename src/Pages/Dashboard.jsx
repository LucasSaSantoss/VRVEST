import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  LuLayoutGrid,
  LuClipboardList,
  LuQrCode,
  LuUserCog,
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
import QrCodeVRVest from "../Components/QrCodeVRVest";
import TabelaUsuarios from "../Components/FormUsuarios/FormUsuarios";
import HeaderQRCode from "../Components/HeaderQRCode";
import TabelaFuncionarios from "../Components/FormFuncionarios/FormFuncionarios";
import ListaPendencias from "../Components/BaixaFinanc/BaixaFinanceira";
import CreateFuncTemp from "../Components/FuncionarioTemporario/FuncionarioTemp";
import ProfileContainer from "../Components/ProfileTabs/ProfileScreen";

export default function Dashboard() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState("");
  const [locked, setLocked] = useState(false);
  const [levelUser, setLevelUser] = useState(0);
  const [popupMessage, setPopupMessage] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [instantClose, setInstantClose] = useState(false);
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const [userName, setUserName] = useState("");

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
      setInstantClose(true);
      setLocked(false);
      setHovered(false);
      setTimeout(() => setInstantClose(false), 50);
    } else {
      setLocked(true);
    }
  };

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
          setSelected((atual) => {
            if (!atual) {
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
            }
            return atual;
          });
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
  }, [navigate]);

  const handleLogoff = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const pages = {
    home: <DashBoardVRVest />,
    relatorios: <RelatorioFinanceiroAtrasados />,
    qrcode: <QrCodeVRVest />,
    funcionarioTemp: <CreateFuncTemp />,
    usuarios: <TabelaUsuarios />,
    funcionarios: <TabelaFuncionarios />,
    baixa: <ListaPendencias />,
    perfil: <ProfileContainer />,
  };

  return (
    <>
      <HeaderQRCode />

      <div className="flex flex-col md:flex-row w-full min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside
          className={`fixed top-[100px] left-0  shadow-lg z-30 flex flex-col justify-between items-center text-white bg-[#16607a]
         ${hovered || locked ? "w-56 sm:w-64" : "w-14 sm:w-16"}
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
          <ul className="p-2 sm:p-3 space-y-1 overflow-y-auto flex-1 w-full">
            {levelUser >= 4 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded 
                transition-colors duration-200 ${
                  selected === "home"
                    ? "bg-white text-gray-800"
                    : "hover:bg-white hover:text-gray-800"
                }`}
                onClick={() => setSelected("home")}
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
                onClick={() => setSelected("qrcode")}
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
                onClick={() => setSelected("usuarios")}
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
                  onClick={() => setSelected("funcionarios")}
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
                onClick={() => setSelected("funcionarioTemp")}
              >
                <FaBusinessTime className="text-xl" />
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Colaborador Temporário
                </span>
              </li>
            )}
            {levelUser >= 3 && (
              <>
                <li
                  className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                  ${selected === "baixa" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                  onClick={() => setSelected("baixa")}
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
                        onClick={() => setSelected("relatorios")}
                      >
                        Relatório de Pendências
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
              onClick={() => setSelected("perfil")}
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
          className="
    flex-1
    p-3 sm:p-5 md:p-6 lg:p-5
    transition-all duration-300
    overflow-y-auto
    mt-[70px] sm:mt-[80px] md:mt-[90px] lg:mt-[50px] ml-[50px]
  "
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

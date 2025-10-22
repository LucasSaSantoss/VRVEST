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

// import HomeVRVest from "../Components/HomeVRVest";
import DashBoardVRVest from "../Components/DashboardComponents/DashboardScreen";
import Relatorios from "../Components/RelatoriosVRVest";
import QrCodeVRVest from "../Components/QrCodeVRVest";
import TabelaUsuarios from "../Components/FormUsuarios/FormUsuarios";
import HeaderQRCode from "../Components/HeaderQRCode";
import TabelaFuncionarios from "../Components/FormFuncionarios/FormFuncionarios";
import ListaPendencias from "../Components/BaixaFinanc/BaixaFinanceira";
import CreateFuncTemp from "../Components/FuncionarioTemporario/FuncionarioTemp";

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

      // reativa a transição depois de fechar
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
        const agora = Date.now() / 1000; // em segundos

        if (decodedToken.exp < agora) {
          // Token expirado
          localStorage.removeItem("token");
          showTemporaryPopup("Sua sessão expirou, faça login novamente.");
          setTimeout(() => {
            navigate("/");
          }, 3000);
        } else {
          // Token válido → define nível de usuário
          const nivel = decodedToken.level;
          setLevelUser(nivel);

          // Só define tela se nenhuma estiver selecionada
          setSelected((atual) => {
            if (!atual) {
              switch (nivel) {
                case 4:
                case 3:
                  return "home";
                case 2:
                  return "usuarios";
                case 1:
                  return "qrcode";
                default:
                  return "home";
              }
            }
            return atual; // mantém a tela atual
          });
        }
      } catch (err) {
        console.error("Erro ao verificar token:", err);
        localStorage.removeItem("token");
        showTemporaryPopup("Token inválido, faça login novamente.");
        navigate("/");
      }
    };

    // Verifica o token imediatamente ao montar
    validarToken();

    // Repete a validação a cada 1 minuto
    const intervalo = setInterval(validarToken, 60 * 1000);

    // Limpa o intervalo ao desmontar o componente
    return () => clearInterval(intervalo);
  }, [navigate, setLevelUser, setSelected]);

  const handleLogoff = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const pages = {
    home: <DashBoardVRVest />,
    relatorios: <Relatorios />,
    qrcode: <QrCodeVRVest />,
    funcionarioTemp: <CreateFuncTemp />,
    usuarios: <TabelaUsuarios />,
    funcionarios: <TabelaFuncionarios />,
    baixa: <ListaPendencias />,
  };

  return (
    <>
      <div>
        <HeaderQRCode />
      </div>
      <div className="flex w-full h-screen bg-gray-100">
        <aside
          className={`shadow-lg ${!instantClose ? "transition-all duration-300" : "transition-all duration-200"} rounded-xl text-white hover:shadow-xl flex flex-col justify-center items-center 
          focus:border-2 focus:ring-blue-500 ${hovered || locked ? "w-64" : "w-16"} mt-[18vh] h-[82%]`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ backgroundColor: "#16607a" }}
        >
          <div className="p-4 flex justify-center items-center border-b">
            <span
              className={`font-bold text-xl transition-opacity duration-300 
              ${hovered ? "opacity-100 " : "opacity-0 absolute"}`}
            ></span>
            <button
              className={`flex items-center hover:opacity-70`}
              onClick={handleToggleLock}
            >
              <span className="text-md rounded-full">
                {locked ? <FaArrowLeft /> : <FaArrowRight />}
              </span>
              <span
                className={`ml-3 ${hovered ? "opacity-100 mr-8" : "hidden"}`}
              >
                {locked ? "Ocultar Menu Lateral" : "Fixar Menu Lateral"}
              </span>
            </button>
          </div>

          {/* Menu */}
          <ul className="p-3 space-y-auto h-[60vh] ">
            {levelUser >= 3 && (
              <li
                data-testid="homeSelection"
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
              ${selected === "home" ? "bg-white text-gray-800 rounded" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("home")}
              >
                <span className="text-xl  rounded-full">
                  <LuLayoutGrid />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Dashboard
                </span>
              </li>
            )}

            {levelUser !== 2 && (
              <li
                data-testid="qrCodeSelection"
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
              ${selected === "qrcode" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("qrcode")}
              >
                <span className="text-xl">
                  <LuQrCode />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  QR Code
                </span>
              </li>
            )}
            {levelUser >= 2 && (
              <li
                data-testid="userSelection"
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "usuarios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("usuarios")}
              >
                <span className="text-xl ">
                  <LuUserCog />
                </span>
                <span
                  className={`ml-1 ${hovered ? "opacity-100 p-2" : "hidden"}`}
                >
                  Cadastro de usuários
                </span>
              </li>
            )}

            {levelUser >= 2 && (
              <li
                data-testid="employeeSelection"
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "funcionarios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("funcionarios")}
              >
                <span className="text-xl ">
                  <FaHospitalUser />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Cadastro de Colaboradores
                </span>
              </li>
            )}

            <li
              data-testid="tempEmployeeSelection"
              className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "funcionarioTemp" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
              onClick={() => setSelected("funcionarioTemp")}
            >
              <span className="text-xl ">
                <FaBusinessTime />
              </span>
              <span
                className={`ml-1 ${hovered ? "opacity-100 p-2" : "hidden"}`}
              >
                Cadastro de Colaborador Temporário
              </span>
            </li>

            {levelUser >= 3 && (
              <li
                data-testid="baixaSelection"
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "baixa" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("baixa")}
              >
                <span className="text-xl">
                  <HiOutlineReceiptTax />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Baixa Financeira
                </span>
              </li>
            )}
            {/* === DROPCOMBO DE RELATÓRIOS === */}
            {levelUser === 4 && (
              <li data-testid="relatorioSelection" className="px-3 mt-2">
                <div
                  className={`flex items-center justify-between cursor-pointer py-2 rounded transition-colors duration-200 ${
                    submenuOpen
                      ? "bg-white text-gray-800"
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
                    <span className="text-sm mr-2">
                      {submenuOpen ? "▲" : "▼"}
                    </span>
                  )}
                </div>

                {/* SUBMENU */}
                {submenuOpen && hovered && (
                  <ul className="ml-6 mt-1 space-y-1 text-sm overflow-y-auto max-h-[12vh]">
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("relatorios")}
                    >
                      Relatório Financeiro
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("usuarios")}
                    >
                      Relatório de Usuários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                    <li
                      className="cursor-pointer hover:text-gray-300"
                      onClick={() => setSelected("funcionarios")}
                    >
                      Relatório de Funcionários
                    </li>
                  </ul>
                )}
              </li>
            )}
          </ul>

          {/* Logoff */}
          <div
            className="p-4 mt-[5vh] border-t flex items-center cursor-pointer hover:text-red-500"
            onClick={handleLogoff}
          >
            <span className="text-xl">
              <CgLogOff />
            </span>
            <span
              className={`ml-3 transition-all duration-300
              ${hovered ? "opacity-100" : "hidden "}`}
            >
              Log Off
            </span>
          </div>
        </aside>

        {/* Main */}
        <main className="flex-1 p-6 transition-all duration-300 overflow-y-auto mt-[14vh]">
          {pages[selected]}
        </main>

        {showPopup && (
          <div className="fixed bottom-5 right-5 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg animate-fade-in">
            {popupMessage}
          </div>
        )}
      </div>
    </>
  );
}

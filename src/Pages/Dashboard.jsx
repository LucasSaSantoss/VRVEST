import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import lockIcon from "../assets/lock.png";
import unlockIcon from "../assets/unlock.png";
import qrcodeIcon from "../assets/qrcodeFind.svg";
import { jwtDecode } from "jwt-decode";

import HomeVRVest from "../Components/homeVRVest";
import RelatoriosVRVest from "../Components/RelatoriosVRVest";
import QrCodeVRVest from "../Components/QrCodeVRVest";
import FormVRVest from "../Components/FormFuncionarios/FormFuncionariosPage";
import UserForm from "../Components/FormUsuarios/UserFormPage";
import GeraQRCode from "../Components/GeradorQRCode/GeraQRCode";
import TabelaUsuarios from "../Components/FormFuncionarios/FormFuncionariosTeste";

export default function Dashboard() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState("home");
  const [locked, setLocked] = useState(false);
  const [levelUser, setLevelUser] = useState(0);

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

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }
    const decodedToken = jwtDecode(token);
    setLevelUser(decodedToken.level);
  }, [navigate]);

  const handleLogoff = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const pages = {
    home: <HomeVRVest />,
    relatorios: <RelatoriosVRVest />,
    qrcode: <QrCodeVRVest />,
    formulario: <FormVRVest />,
    usuario: <UserForm />,
    gerarqrcode: <GeraQRCode />,
    tabela:<TabelaUsuarios/>
  };

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <aside
        className={`bg-[#2faed4] shadow-lg transition-all duration-300 text-white
          ${hovered || locked ? "w-64" : "w-16"}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <span
            className={`font-bold text-xl transition-opacity duration-300 
              ${hovered ? "opacity-100" : "opacity-0 absolute"}`}
          >
            Dashboard
          </span>
          <button
            className="text-sm bg-gray-200 rounded hover:bg-gray-300"
            onClick={() => setLocked(!locked)}
          >
            <img
              src={locked ? lockIcon : unlockIcon}
              alt={locked ? "Travado" : "Destravado"}
              className={`bg-[#2faed4] ${hovered ? "h-6" : "h-6 justify-center items-center ml-0"}`}
            />
          </button>
        </div>

        {/* Menu */}
        <ul className="p-3 space-y-3">
          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("home")}
          >
            <span className="text-xl">🏠</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
            >
              Home
            </span>
          </li>

          {levelUser >= 2 && (
            <li
              className="flex items-center cursor-pointer hover:text-blue-500"
              onClick={() => setSelected("relatorios")}
            >
              <span className="text-xl">📊</span>
              <span
                className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
              >
                Relatórios
              </span>
            </li>
          )}

          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("qrcode")}
          >
            <span className="text-xl">⚙️</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
            >
              QR Code
            </span>
          </li>

          {levelUser >= 2 && (
            <li
              className="flex items-center cursor-pointer hover:text-blue-500"
              onClick={() => setSelected("formulario")}
            >
              <span className="text-xl">📝</span>
              <span
                className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
              >
                Cadastro de Funcionários
              </span>
            </li>
          )}

          {levelUser >= 2 && (
            <li
              className="flex items-center cursor-pointer hover:text-blue-500"
              onClick={() => setSelected("usuario")}
            >
              <span className="text-xl">📝</span>
              <span
                className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
              >
                Cadastro de usuários
              </span>
            </li>
          )}

           {levelUser >= 2 && (
            <li
              className="flex items-center cursor-pointer hover:text-blue-500"
              onClick={() => setSelected("tabela")}
            >
              <span className="text-xl">📝</span>
              <span
                className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
              >
                Tabela de usuários
              </span>
            </li>
          )}

          {levelUser >= 2 && (
            <li
              className="flex items-center cursor-pointer hover:text-blue-500"
              onClick={() => setSelected("gerarqrcode")}
            >
              <span className="text-xl">📝</span>
              <span
                className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}
              >
                Gerador de QRCode
              </span>
            </li>
          )}
        </ul>

        {/* Logoff */}
        <div
          className="p-4 mt-[50vh] border-t flex items-center cursor-pointer hover:text-red-500"
          onClick={handleLogoff}
        >
          <span className="text-xl">🚪</span>
          <span
            className={`ml-3 transition-all duration-300
              ${hovered ? "opacity-100" : "hidden"}`}
          >
            Log Off
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 transition-all duration-300 overflow-y-auto">
        {pages[selected]}
      </main>
    </div>
  );
}

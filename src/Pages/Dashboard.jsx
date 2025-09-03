import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import HomeVRVest from "../Components/homeVRVest";
import RelatoriosVRVest from "../Components/RelatoriosVRVest";
import QrCodeVRVest from "../Components/QrCodeVRVest";
import FormVRVest from "../Components/FormVRVest";
import UserForm from "../Components/userForm";

export default function Dashboard() {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const [selected, setSelected] = useState("home");
  let timeoutId;

  const handleMouseEnter = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setHovered(true), 200);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => setHovered(false), 200);
  };

  useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) navigate("/");
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
  };

  return (
    <div className="flex w-full h-screen bg-gray-100">
      <aside
        className={`bg-white shadow-lg transition-all duration-300
          ${hovered ? "w-64" : "w-16"}`}
        onMouseEnter={ handleMouseEnter}
        onMouseLeave={ handleMouseLeave}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <span
            className={`font-bold text-xl transition-opacity duration-300 
              ${hovered ? "opacity-100" : "opacity-0 absolute"}`}
          >
            Dashboard
          </span>
        </div>

        {/* Menu */}
        <ul className="p-4 space-y-3">
          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("home")}
          >
            <span className="text-xl">🏠</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
            >
              Home
            </span>
          </li>

          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("relatorios")}
          >
            <span className="text-xl">📊</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
            >
              Relatórios
            </span>
          </li>

          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("qrcode")}
          >
            <span className="text-xl">⚙️</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
            >
              QR Code
            </span>
          </li>

          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("formulario")}
          >
            <span className="text-xl">📝</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
            >
              Cadastro de Funcionários
            </span>
          </li>

          <li
            className="flex items-center cursor-pointer hover:text-blue-500"
            onClick={() => setSelected("usuario")}
          >
            <span className="text-xl">📝</span>
            <span
              className={`ml-3 ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
            >
              Cadastro de usuários
            </span>
          </li>
        </ul>

        {/* Logoff */}
        <div
          className="p-4 mt-[40vh] border-t flex items-center cursor-pointer hover:text-red-500"
          onClick={handleLogoff}
        >
          <span className="text-xl">🚪</span>
          <span
            className={`ml-3 transition-all duration-300
              ${hovered ? "opacity-100" : "opacity-0 w-0"}`}
          >
            Log Off
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 transition-all duration-300 overflow-y-auto">
        {pages[selected]} {/* renderiza a tela escolhida */}
      </main>
    </div>
  );
}

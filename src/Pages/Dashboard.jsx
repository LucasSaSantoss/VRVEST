import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import {
  LuLayoutGrid,
  LuClipboardList,
  LuQrCode,
  LuUserCog,
} from "react-icons/lu";
import { FaHospitalUser, FaArrowRight, FaArrowLeft } from "react-icons/fa";
import { CgLogOff } from "react-icons/cg";

import HomeVRVest from "../Components/homeVRVest";
// import RelatoriosVRVest from "../Components/RelatoriosVRVest";
import QrCodeVRVest from "../Components/QrCodeVRVest";
import TabelaUsuarios from "../Components/FormUsuarios/FormUsuarios";
import HeaderQRCode from "../Components/HeaderQRCode";
import TabelaFuncionarios from "../Components/FormFuncionarios/FormFuncionarios";


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
    // relatorios: <RelatoriosVRVest />,
    qrcode: <QrCodeVRVest />,
    tabela: <TabelaUsuarios />,
    funcionarios: <TabelaFuncionarios />,
  };

  return (
    <>
      <div>
        <HeaderQRCode />
      </div>
      <div className="flex w-full h-screen bg-gray-100">
        <aside
          className={`shadow-lg transition-all duration-300 rounded-xl text-white hover:shadow-xl flex flex-col justify-between items-center 
          focus:border-2 focus:ring-blue-500 ${hovered || locked ? "w-64" : "w-16"} mt-[21vh]`}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{ backgroundColor: "rgb(23, 110, 150)" }}
        >
          <div className="p-4 flex justify-between items-center border-b">
            <span
              className={`font-bold text-xl transition-opacity duration-300 
              ${hovered ? "opacity-100" : "opacity-0 absolute"}`}
            ></span>
            <button
              className=" hover:opacity-70"
              onClick={() => setLocked(!locked)}
            >
              {locked ? <FaArrowLeft /> : <FaArrowRight />}
              <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                {locked ? "Ocultar menu lateral" : "Apresentar aba lateral"}
              </span>
            </button>
          </div>

          {/* Menu */}
          <ul className="p-3 space-y-3 h-[60vh] ">
            <li
              className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
              ${selected === "home" ? "bg-white text-gray-800 rounded" : "hover:bg-white hover:text-gray-800"}`}
              onClick={() => setSelected("home")}
            >
              <span className="text-xl  rounded-full">
                <LuLayoutGrid />
              </span>
              <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                Home
              </span>
            </li>

            {levelUser >= 2 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "relatorios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("relatorios")}
              >
                <span className="text-xl">
                  <LuClipboardList />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Relatórios
                </span>
              </li>
            )}

            <li
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

            {levelUser >= 2 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "tabela" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("tabela")}
              >
                <span className="text-xl ">
                  <LuUserCog />
                </span>
                <span
                  className={`ml-1 ${hovered ? "opacity-100 p-2" : "hidden"}`}
                >
                  Tabela de usuários
                </span>
              </li>
            )}

            {levelUser >= 2 && (
              <li
                className={`flex items-center cursor-pointer px-3 py-2 rounded transition-colors duration-200
                ${selected === "funcionarios" ? "bg-white text-gray-800" : "hover:bg-white hover:text-gray-800"}`}
                onClick={() => setSelected("funcionarios")}
              >
                <span className="text-xl ">
                  <FaHospitalUser />
                </span>
                <span className={`ml-3 ${hovered ? "opacity-100" : "hidden"}`}>
                  Tabela Funcionarios
                </span>
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
        <main className="flex-1 p-6 transition-all duration-300 overflow-y-auto mt-[220px]">
          {pages[selected]}
        </main>
      </div>
    </>
  );
}

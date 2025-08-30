import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false); // false = fechada inicialmente
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const usuario = localStorage.getItem("usuario");
    if (!usuario) navigate("/");
  }, [navigate]);

  const toggleSidebar = () => setIsOpen(!isOpen);

  const sidebarOpen = hovered;

  const handleLogoff = () => {
    localStorage.removeItem("usuario");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`bg-white shadow-lg transition-all duration-300
          ${sidebarOpen ? "w-64" : "w-16"}`}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Topo com botão */}
        <div className="p-4 flex justify-between items-center border-b">
          <span
            className={`font-bold text-xl transition-opacity duration-300 
              ${sidebarOpen ? "opacity-100" : "opacity-0 absolute"}`}
          >
            Dashboard
          </span>
          <button onClick={toggleSidebar} className="text-gray-600">
            {/* {isOpen ? "⬅️" : "➡️"} */}
          </button>
        </div>

        {/* Menu */}
        <ul className="p-4 space-y-3">
          <li className="flex items-center cursor-pointer hover:text-blue-500">
            <span className="text-xl">🏠</span>
            <span
              className={`w-full ml-3 p-3 overflow-hidden transition-all duration-50 hover:border-1 rounded-md
                ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
            >
              Home
            </span>
          </li>
          <li className="flex items-center cursor-pointer hover:text-blue-500">
            <span className="text-xl">📊</span>
            <span
              className={`w-full ml-3 p-3 overflow-hidden transition-all duration-50 hover:border-1 rounded-md
                ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
            >
              Relatórios
            </span>
          </li>
          <li className="flex items-center cursor-pointer hover:text-blue-500">
            <span className="text-xl">⚙️</span>
            <span
              className={`w-full ml-3 p-3 overflow-hidden transition-all duration-50 hover:border-1 rounded-md
                ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
            >
              Configurações
            </span>
          </li>
        </ul>
        <div
          className="p-4 mt-[55vh] border-t flex items-center cursor-pointer hover:text-red-500"
          onClick={handleLogoff}
        >
          <span className="text-xl">🚪</span>
          <span
            className={`ml-3 overflow-hidden transition-all duration-300
              ${sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"}`}
          >
            Log Off
          </span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 p-6 transition-all duration-300">
        <h1 className="text-3xl font-bold">Bem-vindo ao Dashboard 🚀</h1>
        <p className="mt-2 text-gray-600">
          Aqui você poderá acessar relatórios, estatísticas e configurações do
          sistema.
        </p>
      </main>
    </div>
  );
}

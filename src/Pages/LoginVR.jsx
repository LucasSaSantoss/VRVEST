import { useState } from "react";
import { loginUsuario } from "../services/api";

export default function LoginVR() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [popupTemporario, setPopupTemporario] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setPopupTemporario(false);

    const res = await loginUsuario({ email, password });

    if (res.success) {
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } else {
      setError(res.message || "Usuário ou senha incorretos.");
      setPopupTemporario(true);
      setTimeout(() => setPopupTemporario(false), 3000);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans bg-white flex flex-col md:flex-row overflow-hidden">
      {/* LADO ESQUERDO */}
      <div className="w-full md:w-2/3 bg-white flex flex-col justify-between p-3 md:p-5">
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex flex-col mt-1 md:mt-1">
            <span className="text-4xl md:text-6xl font-bold text-gray-800">
              e - Vestuário
            </span>
            <div className="mt-4 md:mt-6">
              <h1 className="text-lg md:text-2xl font-bold text-gray-800">
                Sistema de Gerenciamento de Vestuário
              </h1>
              <p className="text-gray-600 mt-2 uppercase text-sm md:text-base">
                Versão de Lançamento
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center mt-1 md:mt-0">
            <img
              className="w-32 md:w-52"
              src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
              alt="Logo Viva-Rio"
            />
          </div>
        </div>

        {/* Imagem Central */}
        <div className="flex justify-center items-center mt-5 mb-6 md:mb-10">
          <img
            className="w-3/4 md:w-[60vh] max-w-[500px]"
            src="https://vrdocs.hmas.com.br/images/index_giphy.webp"
            alt="Animação do sistema"
          />
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="w-full md:w-1/3 bg-[#2faed4] flex flex-col items-center justify-start text-white p-6 md:p-8 relative">
        {/* Logo Superior */}
        <div className="w-[70%] flex items-center justify-center mt-10 md:mt-16 mb-10 md:mb-20">
          <img
            className="w-48 md:w-64"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </div>

        {/* Formulário */}
        <form
          className="w-full max-w-sm flex flex-col gap-4"
          onSubmit={handleLogin}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm md:text-base">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg h-10 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm md:text-base"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm md:text-base">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg h-10 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm md:text-base"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="py-2 bg-blue-600 rounded-md text-white font-semibold hover:bg-blue-800 transition-colors mt-6 text-sm md:text-base"
          >
            Entrar
          </button>
        </form>

        {/* POPUP DE ERRO */}
        {popupTemporario && (
          <div className="absolute bottom-6 right-6 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeInOut">
            {error}
          </div>
        )}

        {/* Animação Popup */}
        <style jsx>{`
          @keyframes fadeInOut {
            0% {
              opacity: 0;
              transform: translateY(10px);
            }
            10% {
              opacity: 1;
              transform: translateY(0);
            }
            90% {
              opacity: 1;
              transform: translateY(0);
            }
            100% {
              opacity: 0;
              transform: translateY(10px);
            }
          }
          .animate-fadeInOut {
            animation: fadeInOut 3s ease-in-out;
          }
        `}</style>
      </div>
    </div>
  );
}

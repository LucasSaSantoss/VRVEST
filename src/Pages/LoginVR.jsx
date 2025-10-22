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

    console.log("=== LOGIN DEBUG FINAL ===");
    console.log("Token recebido no front:", res.token);
    console.log("Tamanho:", res.token?.length || "indefinido");

    if (res.success) {
      localStorage.setItem("token", res.token);
      window.location.href = "/dashboard";
    } else {
      setError(res.message || "Usuário ou senha incorretos.");
      setPopupTemporario(true);

      setTimeout(() => {
        setPopupTemporario(false);
      }, 3000);
    }
  };

  return (
    <div className="h-screen w-screen font-sans overflow-hidden flex">
      {/* LADO ESQUERDO */}
      <div className="w-2/3 bg-white flex flex-col justify-between p-8">
        <div className="flex justify-between items-start">
          <div className="flex flex-col mt-10">
            <span className="text-6xl font-bold">e - Vestuário</span>
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Sistema de Gerenciamento de Vestuário
              </h1>
              <p className="text-gray-600 mt-2 uppercase">
                Versão de Lançamento
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <img
              className="w-50 mt-10"
              src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
              alt="Logo Viva-Rio"
            />
          </div>
        </div>

        <div className="flex justify-center items-center mb-5">
          <img
            className="w-[70vh]"
            src="https://vrdocs.hmas.com.br/images/index_giphy.webp"
            alt=""
          />
        </div>
      </div>

      {/* LADO DIREITO */}
      <div className="w-1/3 bg-[#2faed4] flex flex-col items-center justify-start text-white p-8 relative">
        <div className="w-[70%] flex items-center justify-center mt-15 mb-30">
          <img
            className="w-100"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </div>

        <form
          className="w-full max-w-sm flex flex-col gap-4"
          onSubmit={handleLogin}
        >
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg h-10 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="email@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm">
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg h-10 px-3 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              placeholder="Password"
            />
          </div>

          <button
            type="submit"
            className="py-2 bg-blue-600 rounded-md text-white font-semibold hover:bg-blue-800 transition-colors mt-6"
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

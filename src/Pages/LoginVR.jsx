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

      // fecha popup depois de 3 segundos
      setTimeout(() => {
        setPopupTemporario(false);
      }, 3000);
    }
  };
  return (
    <div className="h-screen w-screen font-sans overflow-hidden flex">
      <div className="w-[65%] bg-white flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="h-32 w-90 flex-1 flex-col items-start mt-10">
            <div className="flex items-center">
              <span className="text-6xl px-1 py-0.5 font-bold whitespace-nowrap">
                e - Vestuário
              </span>
            </div>
            <div className="mt-6 ">
              <h1 className="text-2xl font-bold text-gray-800">
                Sistema de Gerenciamento de Vestuário
              </h1>
              <p className="text-gray-600 mt-2 uppercase">
                Versão de Lançamento
              </p>
            </div>
          </div>
          <div className="h-50 w-50 flex items-center justify-center">
            <img
              className="imgViva w-[100%] mt-10"
              src="https://vrdocs.hmas.com.br/images/Logo_Viva-Rio.png"
              alt="Logo Viva-Rio"
            />
          </div>
        </div>
        <div className="ml-[10vw] mb-5 w-[30vw] scale-120">
          <img
            src="https://vrdocs.hmas.com.br/images/index_giphy.webp"
            alt=""
          />
        </div>
      </div>

      <div className="w-[35%] bg-[#2faed4] flex flex-col items-center text-white p-8">
        <div className="w-[70%] mt-10 flex items-center justify-center">
          <img
            className="w-[30vw] mr-12"
            src="https://vrdocs.hmas.com.br/images/AlbertSchweitzer_Branco.png"
            alt="VR Vest Image"
          />
        </div>
        <form
          className="w-full max-w-md mt-16 flex flex-col gap-4"
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
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-sm">
                Senha
              </label>
              {/* <a href="#" className="text-sm text-blue-100 hover:underline">
                Esqueceu a senha?
              </a> */}
            </div>
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
            className="w-[20%] py-2 bg-blue-600 rounded-md text-white font-semibold hover:bg-blue-800 transition-colors mt-8"
          >
            Entrar
          </button>

          {/* {error && <p className="text-red-500 mt-2">{error}</p>} */}
        </form>
        {/* Popup de erro */}
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

import { useState } from "react";
import { loginUsuario } from "../services/api";

export default function LoginVR() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  const res = await loginUsuario({ email, password });
  
  if (res.success) {
    localStorage.setItem("token", res.token);
    window.location.href = "/dashboard";
  } else {
    setError(res.message);
    console.log(email,password,res.token)
  }
};
  return (
    <div className="h-screen w-screen font-sans overflow-hidden flex">
      <div className="w-[65%] bg-white flex flex-col justify-between p-6">
        <div className="flex justify-between items-start">
          <div className="h-32 w-90 flex flex-col items-start mt-10">
            <div className="flex items-center">
              <span className="flex justify-center items-center border-2 rounded-2xl text-4xl px-1 py-0.5 font-bold h-14 w-20">
                VR
              </span>
              <p className="text-7xl pl-2">VEST</p>
            </div>
            <div className="mt-6">
              <h1 className="text-2xl font-bold text-gray-800">
                Sistema de Gestão de Vestes
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
              <a href="#" className="text-sm text-blue-100 hover:underline">
                Esqueceu a senha?
              </a>
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

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}

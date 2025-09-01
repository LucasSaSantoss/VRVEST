import { useState } from "react";
import { loginUsuario } from "../services/api"; // <- importa do seu arquivo axios.js (ajuste o caminho certo!)

export default function LoginVR() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const res = await loginUsuario({ email, password });

    if (res.success) {
      localStorage.setItem("usuario", JSON.stringify(res.user));

      window.location.href = "/dashboard";
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="h-screen w-screen font-sans overflow-hidden flex">
      {/* lado esquerdo */}
      <div className="w-[65%] bg-white flex flex-col justify-between p-6">
        {/* ... o resto do seu layout ... */}
      </div>

      {/* lado direito */}
      <div className="w-[35%] bg-[#2faed4] flex flex-col items-center text-white p-8">
        {/* ... imagem ... */}

        <form className="w-full max-w-md mt-16 flex flex-col gap-4" onSubmit={handleLogin}>
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm">Email</label>
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
              <label htmlFor="password" className="text-sm">Senha</label>
              <a href="#" className="text-sm text-blue-100 hover:underline">Esqueceu a senha?</a>
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

          <button type="submit" className="w-[20%] py-2 bg-blue-600 rounded-md text-white font-semibold hover:bg-blue-800 transition-colors mt-8">
            Entrar
          </button>

          {error && <p className="text-red-500 mt-2">{error}</p>}
        </form>
      </div>
    </div>
  );
}

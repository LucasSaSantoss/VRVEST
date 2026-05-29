import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import React from "react";
import PasswordChange from "./PasswordChange";
import ItemsInfos from "./ItemsInfos";
import UniformSettings from "./UniformSettings";

export default function ProfileContainer() {
  const [activeTab, setActiveTab] = useState(1);
  const [nivelAcesso, setNivelAcesso] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setNivelAcesso(decoded.level);
      } catch (err) {
        console.error("Erro ao decodificar token:", err);
      }
    }
  }, []);

  const isAdmin = nivelAcesso === 4 || nivelAcesso === 5;

  return (
    <div className="max-w-[900px] mx-auto mt-20 bg-white shadow-xl rounded-2xl border p-6">
      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 1 ? "border-blue-600 text-blue-600" : "border-transparent"
          }`}
          onClick={() => setActiveTab(1)}
        >
          Alterar Senha
        </button>

        <button
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 2 ? "border-blue-600 text-blue-600" : "border-transparent"
          } ${!isAdmin ? "opacity-40 invisible cursor-not-allowed" : ""}`}
          onClick={() => {
            if (isAdmin) setActiveTab(2);
          }}
        >
          Configuração Itens
        </button>

        <button
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 3 ? "border-blue-600 text-blue-600" : "border-transparent"
          } ${!isAdmin ? "opacity-40 invisible cursor-not-allowed" : ""}`}
          onClick={() => {
            if (isAdmin) setActiveTab(3);
          }}
        >
          Configuração de Uniformes
        </button>
      </div>

      {activeTab === 1 && <PasswordChange />}

      {activeTab === 2 &&
        (isAdmin ? (
          <ItemsInfos />
        ) : (
          <div className="text-center text-red-500 font-semibold">
            Acesso negado. Você não tem permissão para visualizar esta aba.
          </div>
        ))}

      {activeTab === 3 &&
        (isAdmin ? (
          <UniformSettings />
        ) : (
          <div className="text-center text-red-500 font-semibold">
            Acesso negado. Você não tem permissão para visualizar esta aba.
          </div>
        ))}
    </div>
  );
}

import { useState, useEffect } from "react";
import { jwtDecode } from "jwt-decode";
import React from "react";
import { Navigate } from "react-router-dom";
import PasswordChange from "./PasswordChange";
import ItemsInfos from "./ItemsInfos";

export default function ProfileContainer() {
  const [activeTab, setActiveTab] = useState(1);
  const [nivelAcesso, setNivelAcesso] = useState(null);

  useEffect(() => {
    // Lê token e pega nível de acesso
    const token = localStorage.getItem("token");

    if (token) {
      try {
        const decoded = jwtDecode(token);
        setNivelAcesso(decoded.level); // exemplo: "admin", "user"
        console.log(decoded);
      } catch (err) {
        console.error("Erro ao decodificar token:", err);
      }
    }
  }, []);

  return (
    <div className="max-w-[900px] mx-auto mt-20 bg-white shadow-xl rounded-2xl border p-6">
      {/* ------------ TABS --------------- */}
      <div className="flex border-b mb-6">
        <button
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 1
              ? "border-blue-600 text-blue-600"
              : "border-transparent"
          }`}
          onClick={() => setActiveTab(1)}
        >
          Alterar Senha
        </button>

        <button
          className={`px-6 py-3 font-semibold border-b-2 transition-all ${
            activeTab === 2
              ? "border-blue-600 text-blue-600"
              : "border-transparent"
          } ${nivelAcesso !== 4 && nivelAcesso !== 5 ? "opacity-40 invisible cursor-not-allowed" : ""}`}
          onClick={() => {
            if (nivelAcesso === 5 || nivelAcesso === 4) setActiveTab(2);
          }}
        >
          Configuração Itens
        </button>
      </div>

      {/* ---------- CONTEÚDO DAS ABAS ----------- */}
      {activeTab === 1 && <PasswordChange />}

      {activeTab === 2 &&
        (nivelAcesso === 5 || nivelAcesso === 4 ? (
          <ItemsInfos />
        ) : (
          <div className="text-center text-red-500 font-semibold">
            Acesso negado. Você não tem permissão para visualizar esta aba.
          </div>
        ))}
    </div>
  );
}

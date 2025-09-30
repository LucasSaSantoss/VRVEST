import axios from "axios";
// import { navigate } from "react-router-dom";
// import jwtDecode from "jwt-decode";

const API_URL = "http://localhost:3000";

// 🔹 Carregar lista de funcionários
export default async function carregarFuncionarios() {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(`${API_URL}/empl`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao carregar funcionários:", err);
    return [];
  }
}

export async function verificarCpf(cpf) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(`${API_URL}/empl/verificar-cpf/${cpf}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao verificar CPF:", err);
    return { error: "Erro na verificação" };
  }
}

// 🔹 Cadastrar funcionário (inclui ID e nome do usuário logado)
export async function cadastrarFuncionario({
  name,
  cpf,
  email,
  sector,
  position,
  modality,
}) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/empl`,
      { name, cpf, email, sector, position, modality },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: res.data,
      message: "Funcionário cadastrado com sucesso!",
    };
  } catch (err) {
    console.log(
      "Erro ao criar funcionário:",
      err.response?.data || err.message
    );
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function cadastrarFuncionarioTemporario({
  name,
  cpf,
  email,
  sector,
  position,
  modality,
  obs,
  avatarImage, // agora é File
}) {
  try {
    const token = localStorage.getItem("token");

    const formData = new FormData();
    formData.append("name", name);
    formData.append("cpf", cpf);
    formData.append("email", email);
    formData.append("sector", sector);
    formData.append("position", position);
    formData.append("modality", modality);
    formData.append("obs", obs);

    if (avatarImage) {
      formData.append("avatarImage", avatarImage.file); // envia como arquivo
    }

    const res = await axios.post(`${API_URL}/empl/tempEmpl`, formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return {
      success: true,
      data: res.data,
      message: res.message || "Funcionário cadastrado com sucesso!",
    };
  } catch (err) {
    console.log(
      "Erro ao criar funcionário:",
      err.response?.data || err.message
    );
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function alterarFuncionario(id, dados) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(`${API_URL}/empl/${id}`, dados, {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log("Funcionário alterado:", res);
    return res.data; // retorna os dados atualizados
  } catch (err) {
    console.error("Erro ao alterar funcionário:", err);
    return { success: false, message: "Não foi possível alterar o registro." };
  }
}

export async function alterarUsuario(id, dados) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(`${API_URL}/users/${id}`, dados, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao atualizar usuário:", err);
    return {
      success: false,
      message: "Erro ao atualizar usuário.",
    };
  }
}

// 🔹 Cadastro de usuário
export async function cadastrarUsuario({
  name,
  email,
  password,
  sector,
  position,
  level,
}) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post(
      `${API_URL}/users`,
      {
        name,
        email,
        password,
        sector,
        position,
        level,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: res.data,
      message: "Usuário cadastrado com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao criar usuário:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

// 🔹 Login de usuário com JWT
export async function loginUsuario({ email, password }) {
  try {
    const res = await axios.post(`${API_URL}/login`, { email, password });
    return { success: true, token: res.data.token, message: res.data.message };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function getOpenPendencies({ cpf }) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post(
      `${API_URL}/empl/pendencias`,
      { cpf },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    return res.data;
  } catch (err) {
    console.error(
      "Erro ao buscar pendências:",
      err.response?.data || err.message
    );
    return { success: false, total: 0, list: [] };
  }
}

// 🔹 Verificação de CPF e registro de Kit
export async function registrarKit({ cpf, kitSize }) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/empl/registrarKit`,
      { cpf, kitSize },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      message: res.data.message,
      pendencia: res.data.pendencia,
      funcionario: res.data.funcionario,
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function devolucaoKit({ cpf, id }) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/empl/devolver`,
      { cpf, id },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      message: res.data.message,
      pendencia: res.data.pendencia,
    };
  } catch (err) {
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function carregarPendencias() {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(`${API_URL}/pend`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao carregar pendências:", err);
    return { success: false, message: "Erro ao buscar pendências" };
  }
}

// ------------------------------ Verificação de Token ----------------------------

const api = axios.create({
  baseURL: API_URL,
});

// Interceptor para anexar token em cada requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para capturar erros de resposta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const msg = error.response.data?.message;

      if (msg === "Token expirado" || msg === "Token inválido") {
        localStorage.removeItem("token");
        window.location.href = "/"; // redireciona pro login
      }
    }
    return Promise.reject(error);
  }
);

export { api };

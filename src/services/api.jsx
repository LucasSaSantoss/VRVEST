import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

// ------------------------------ Funções de API ----------------------------

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

export async function cadastrarEmail({ cpf, email }) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.post(
      `${API_URL}/empl/cadastrar-email`,
      { cpf, email },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data;
  } catch (err) {
    console.error("Erro ao cadastrar email:", err);
    return { success: false, message: "Erro ao cadastrar email" };
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
  matricula,
  PermissTrauma,
}) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/empl`,
      {
        name,
        cpf,
        email,
        sector,
        position,
        modality,
        matricula,
        PermissTrauma,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: res.data,
      message: res.data.message || "Funcionário cadastrado com sucesso!",
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

    console.log(res.data.message);

    return {
      success: true,
      data: res.data,
      message: res.data.message || "Funcionário cadastrado com sucesso!",
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
    return { success: false, message: "Registro sem alteração." };
  }
}

export async function importarFuncionarios(dados) {
  const token = localStorage.getItem("token");

  try {
    const res = await axios.post(
      `${API_URL}/empl/importar-funcionarios`,
      { funcionarios: dados },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: res.data.success,
      message: res.data.message || "Importação concluída com sucesso!",
      ignorados: res.data.ignorados,
    };
  } catch (err) {
    console.error(
      "Erro ao importar colaboradores:",
      err.response?.data || err.message
    );
    return {
      success: false,
      message:
        err.response?.data?.message ||
        "Erro ao enviar os dados para o servidor.",
    };
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

// Alteração de Senha
export async function alterarSenha({ id, oldPassword, newPassword }) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(
      `${API_URL}/passchange/${id}`,
      { oldPassword, newPassword },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    return {
      success: true,
      data: res.data,
      message: "Senha alterada com sucesso!",
    };
  } catch (err) {
    console.error("Erro ao alterar senha:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
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
    const res = await axios.post(
      `${API_URL}/login`,
      { email, password },
      { headers: { "Content-Type": "application/json" } }
    );

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
export async function registrarKit({ cpf, kitSize, kitType }) {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/empl/registrarKit`,
      { cpf, kitSize, kitType },
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

export async function carregarPendencias(inicio, fim) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.get(`${API_URL}/pend`, {
      headers: { Authorization: `Bearer ${token}` },
      params: { inicio, fim },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao carregar pendências:", err);
    return { success: false, message: "Erro ao buscar pendências" };
  }
}

export const listarSetores = async () => {
  try {
    const response = await axios.get(`${API_URL}/sec/sectors`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Erro ao listar setores:", error);
    return { success: false, data: [] };
  }
};

export const listarModalidades = async () => {
  try {
    const response = await axios.get(`${API_URL}/mod/modalities`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Erro ao listar modalidades:", error);
    return { success: false, data: [] };
  }
};

export const listarEspecialidades = async () => {
  try {
    const response = await axios.get(`${API_URL}/spe/specialties`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Erro ao listar especialidades:", error);
    return { success: false, data: [] };
  }
};

export const listarItems = async () => {
  try {
    const response = await axios.get(`${API_URL}/items/items-info`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Erro ao carregar itens:", error);
    return { success: false, data: [] };
  }
};

export const alterarItens = async (idUser, pijamaValue) => {
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      `${API_URL}/items/items-change`,
      { idUser, pijamaValue },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return { success: true, data: res.data };
  } catch (error) {
    console.error("Erro ao alterar itens:", error);
    return { success: false, data: [] };
  }
};

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

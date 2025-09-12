import axios from "axios";

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
  try {
    const res = await axios.post(`${API_URL}/users`, {
      name,
      email,
      password,
      sector,
      position,
      level,
    });

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

export async function atualizarPendencia(id, dados) {
  const token = localStorage.getItem("token");
  try {
    const res = await axios.put(`${API_URL}/pend/${id}`, dados, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.data;
  } catch (err) {
    console.error("Erro ao atualizar pendência:", err);
    return { success: false, message: "Erro ao atualizar pendência." };
  }
}

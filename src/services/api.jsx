import axios from "axios";

const API_URL = "http://localhost:3000";

export async function carregarUsuarios() {
  try {
    const res = await axios.get("http://localhost:3000/users");
    console.log("Usuários:", res.data);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

export async function cadastrarUsuario({ name,email, password, sector, position, level }) {
  try {
    const res = await axios.post(`${API_URL}/users`, {
      name,
      email,
      password,
      sector: sector ,
      position: position,
      level: level, 
    });

    return {
      success: true,
      data: res.data,
      message: "Usuário cadastrado com sucesso!"
    };
  } catch (err) {
    console.error("Erro ao criar usuário:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function cadastrarFuncionario({ name,cpf, email, sector, position, cadUserID, cadUserName, modality }) {
  try {
    const res = await axios.post(`${API_URL}/empl`, {
      name,
      cpf,
      email,
      sector: sector ,
      position: position,
      cadUserID,
      cadUserName,
      modality,
    });

    return {
      success: true,
      data: res.data,
      message: "Funcionário cadastrado com sucesso!"
    };
  } catch (err) {
    console.error("Erro ao criar Funcionário:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}



export async function loginUsuario({ email, password }) {
  try {
    const res = await axios.post("http://localhost:3000/login", {
      email,
      password,
    });
    return {
      success: true,
      token: res.data.token,
      message: res.data.message,
    };
  } catch (err) {
    console.log("Tentando login com:", email, password);
    console.error("Erro no login:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}





export async function verificaCpf({ cpf }) {
  console.log("teste3");
  try {
    const res = await axios.post("http://localhost:3000/api/qrcode", {
      cpf: cpf,
    });
    if (res.data.success) {
      return res.data;
    } else {
      return { message: "Cpf não cadastrado", success: false };
    }
  } catch (err) {
    console.error(
      "Erro na verificação do Cpf:",
      err.response?.data || err.message
    );
    return { success: false };
  }
}

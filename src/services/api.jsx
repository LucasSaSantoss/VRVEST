import axios from "axios";

export async function carregarUsuarios() {
  try {
    const res = await axios.get("http://localhost:3000/usuarios");
    console.log("Usuários:", res.data);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

export async function criarUsuario({ name, email, password }) {
  try {
    const res = await axios.post("http://localhost:3000/usuarios", {
      name: name,
      email: email,
      password: password,
      sector: "TI",
      position: "Dev",
      Level: 1,
    });
    console.log(res.data);
  } catch (err) {
    console.error("Erro ao criar usuário:", err.response?.data || err.message);
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
    console.error("Erro no login:", err.response?.data || err.message);
    return {
      success: false,
      message: err.response?.data?.message || "Erro no servidor",
    };
  }
}

export async function verificaCpf({ cpf }) {
  console.log('teste3')
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
    console.error("Erro na verificação do Cpf:", err.response?.data || err.message);
    return {success :false}
  }
}
 receba
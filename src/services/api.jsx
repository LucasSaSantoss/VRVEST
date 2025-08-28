import axios from "axios";

// Carregar todos os usuários
export async function carregarUsuarios() {
  try {
    const res = await axios.get("http://localhost:3000/usuarios");
    console.log("Usuários:", res.data);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

// Criar um novo usuário
export async function criarUsuario({name, email, password}) {
  try {
    const res = await axios.post("http://localhost:3000/usuarios", {
      name: name,         
      email: email,
      password: password,       
      sector: "TI",
      position: "Dev",
      Level: 1                  
    });
    console.log(res.data);
  } catch (err) {
    console.error("Erro ao criar usuário:", err.response?.data || err.message);
  }
}

export async function loginUsuario() {
  try {
    const res = await axios.post("http://localhost:3000/usuarios/login", {
      email: "alisson@email.com",
      password: "123456"
    });

    if (res.data.success) {
      console.log("Login realizado:", res.data.user);
      // aqui você pode salvar no estado global ou localStorage
       localStorage.setItem("usuario", JSON.stringify(res.data.user));
    } else {
      console.log("Email ou senha inválidos");
    }
  } catch (err) {
    console.error("Erro no login:", err.response?.data || err.message);
  }
}

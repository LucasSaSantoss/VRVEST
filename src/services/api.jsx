import axios from "axios";


export async function carregarUsuarios() {
  try {
    const res = await axios.get("http://localhost:3000/usuarios");
    console.log("Usuários:", res.data);
  } catch (err) {
    console.error("Erro ao carregar usuários:", err);
  }
}

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

export async function loginUsuario({email,password}) {
  try {
    const res = await axios.post("http://localhost:3000/api/login", {
      email: email,
      password: password
    });
    if (res.data.success) {
       localStorage.setItem("usuario", JSON.stringify(res.data.user));
       return res.data
    } else {
      console.log("Email ou senha inválidos");
      return {message: 'Usuário não autorizado'}
    }
  } catch (err) {
    console.error("Erro no login:", err.response?.data || err.message);
  }
}

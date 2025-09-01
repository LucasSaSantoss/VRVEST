import bcrypt from "bcrypt";

async function gerarHash() {
  const hash = await bcrypt.hash("1234", 10); // senha de teste
  console.log(hash);
}

gerarHash();
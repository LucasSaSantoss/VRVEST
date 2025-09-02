import bcrypt from "bcrypt";

async function gerarHash() {
  const hash = await bcrypt.hash("1234", 10); 
  console.log(hash);
}

gerarHash();
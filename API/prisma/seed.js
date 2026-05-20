import "dotenv/config";
import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const TAMANHOS_PADRAO_UNIFORME = ["P", "M", "G", "GG", "XXG", "EXG", "G1"];

async function main() {
  const name = process.env.SEED_USER_NAME || "Administrador";
  const email = process.env.SEED_USER_EMAIL || "admin@vrvest.local";
  const password = process.env.SEED_USER_PASSWORD;
  const sector = process.env.SEED_USER_SECTOR || "TI";
  const position = process.env.SEED_USER_POSITION || "Administrador do Sistema";
  const level = Number(process.env.SEED_USER_LEVEL || 4);
  const active = Number(process.env.SEED_USER_ACTIVE || 1);

  if (!password) {
    throw new Error(
      "Defina SEED_USER_PASSWORD no API/.env antes de executar o seed."
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      name,
      password: hashedPassword,
      sector,
      position,
      level,
      active,
    },
    create: {
      name,
      email,
      password: hashedPassword,
      sector,
      position,
      level,
      active,
    },
  });

  for (const code of TAMANHOS_PADRAO_UNIFORME) {
    await prisma.uniformSize.upsert({
      where: { code },
      update: { active: 1 },
      create: { code, active: 1 },
    });
  }

  console.log("Seed concluido com sucesso.");
  console.log(`Usuario pronto para login: ${user.email} (id: ${user.id})`);
  console.log(`Tamanhos padrao garantidos: ${TAMANHOS_PADRAO_UNIFORME.join(", ")}`);
}

main()
  .catch((error) => {
    console.error("Erro ao executar seed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

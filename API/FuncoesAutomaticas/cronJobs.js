import cron from "node-cron";
import { PrismaClient } from "@prisma/client";
import { formatInTimeZone, format } from "date-fns-tz";
import { differenceInHours, differenceInMinutes } from "date-fns";

const prisma = new PrismaClient();

export const validaFuncTemp = async () => {
  try {
    // Busca o funcionário existente
    const funcTemp = await prisma.employee.findMany({
      where: { tempEmpl: 1, active: 1 },
    });
    const agora = new Date();
    const funcAlterados = [];

    for (const func of funcTemp) {
      if (func.tempAlterDate) {
        const dataBR = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
        const difference = differenceInHours(dataBR, func.tempAlterDate);

        if (difference >= 36) {
          const funcAtualizado = await prisma.employee.update({
            where: { id: func.id },
            data: {
              tempAlterDate: dataBR,
              active: 2,
            },
          });

          await prisma.userLog.create({
            data: {
              userId: 1, // ID especial p/ "Sistema"
              action: "Validação automática de Funcionário Temporário",
              changes: {
                active: { old: 1, new: 2 },
              },
              newData: dataBR,
            },
          });

          funcAlterados.push(funcAtualizado);
        }
      }
    }

    if (funcAlterados.length > 0) {
      console.log(
        `[CRON] Funcionários temporários validados: ${funcAlterados.length}`
      );
    }
  } catch (err) {
    console.error("[CRON] Erro ao validar funcionários temporários:", err);
  }
};

// Agenda para rodar de 1 em 1 hora
cron.schedule("0 * * * *", () => {
  console.log("[CRON] Rodando validação automática...");
  validaFuncTemp();
});

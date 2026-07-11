// workers/emailWorker.js
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { enviarEmailComConfirmacao } from "../emailService.js";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    const { para, assunto, mensagem } = job.data;

    console.log(` Processando e-mail para ${para}...`);

    // [MANUTENCAO] Motivo: fazer o worker falhar quando o SMTP não confirmar o envio.
    // [MANUTENCAO] Impacto: BullMQ registra corretamente job com falha, permitindo diagnóstico/retry.
    // [MANUTENCAO] Data: 2026-06-22
    // [MANUTENCAO] Autor: Márlon Etiene
    await enviarEmailComConfirmacao(para, assunto, mensagem);

    console.log(`✅ E-mail enviado para ${para}`);
  },
  { connection }
);

worker.on("completed", (job) => {
  console.log(`Job ${job.id} concluído com sucesso`);
});

worker.on("failed", (job, err) => {
  console.error(`Job ${job.id} falhou:`, err);
});

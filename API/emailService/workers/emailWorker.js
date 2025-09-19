// workers/emailWorker.js
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { enviarEmail } from "../emailService";

const connection = new IORedis({
  host: "127.0.0.1",
  port: 6379,
});

const worker = new Worker(
  "emailQueue",
  async (job) => {
    const { para, assunto, mensagem } = job.data;

    console.log(` Processando e-mail para ${para}...`);

    await enviarEmail(para, assunto, mensagem);

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

import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();
const smtpPort = Number(process.env.EMAIL_PORT || 587);

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: smtpPort,
  secure: smtpPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const enviar = async (
  to,
  subject,
  text,
  cc = null,
  bcc = null,
  throwOnError = false
) => {
  const formatEmails = (emails) =>
    Array.isArray(emails) ? emails.join(", ") : emails;

  try {
    await transporter.sendMail({
      from: `"Equipe e-Vestuário" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      cc: cc ? formatEmails(cc) : undefined,
      bcc: bcc ? formatEmails(bcc) : undefined,
    });
    console.log(`E-mail enviado para ${formatEmails(to)}`);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error.message);

    try {
      await prisma.userLog.create({
        data: {
          action: "Erro ao enviar email",
          newData: {
            recipient: formatEmails(to) || null,
            subject: subject || null,
            error: error?.message || String(error),
            code: error?.code || null,
            command: error?.command || null,
          },
          createdAt: new Date(),
          userId: 1,
        },
      });
    } catch (logErr) {
      console.error("Erro ao salvar log de e-mail no banco:", logErr.message);
    }

    // [MANUTENCAO] Motivo: preservar fluxos legados e, ao mesmo tempo, informar falha real aos chamadores.
    // [MANUTENCAO] Impacto: chamadas legadas recebem success=false sem interromper a operação; chamadas confirmadas relançam o erro.
    // [MANUTENCAO] Data: 2026-06-22
    // [MANUTENCAO] Autor: Márlon Etiene
    if (throwOnError) throw error;
    return {
      success: false,
      message: error?.message || "Falha no envio de e-mail.",
    };
  }
};

/**
 * Mantém o comportamento legado: registra a falha, sem interromper o fluxo chamador.
 */
export const enviarEmail = async (to, subject, text, cc = null, bcc = null) =>
  enviar(to, subject, text, cc, bcc, false);

/**
 * Propaga a falha para fluxos que tratam a notificação separadamente da operação.
 */
export const enviarEmailComConfirmacao = async (
  to,
  subject,
  text,
  cc = null,
  bcc = null
) => enviar(to, subject, text, cc, bcc, true);

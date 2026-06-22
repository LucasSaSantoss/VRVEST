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
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error.message);

    try {
      await prisma.userLog.create({
        data: {
          action: "Erro ao enviar email",
          newData: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          createdAt: new Date(),
          userId: 1,
        },
      });
    } catch (logErr) {
      console.error("Erro ao salvar log de e-mail no banco:", logErr.message);
    }

    if (throwOnError) throw error;
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

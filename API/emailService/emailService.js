import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: "sandbox.smtp.mailtrap.io",
  port: 587,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


/**
 * Envia email para funcionário
 * @param {string|string[]} to - Email do funcionário
 * @param {string} subject - Assunto
 * @param {string} text - Texto do corpo
 * @param {string|string[]}[cc] - E-mails em cópia
 * @param {string|string[]}[bcc] - E-mails em cópia oculta
 */
export const enviarEmail = async (to, subject, text, cc = null, bcc = null) => {
  const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);
  try {
    const formatEmails = (emails) =>
      Array.isArray(emails) ? emails.join(", ") : emails;

    await transporter.sendMail({
      from: `"Equipe e-Vestuário" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      cc: cc ? formatEmails(cc) : undefined,
      bcc: bcc ? formatEmails(bcc) : undefined,
    });
    console.log(`✅ Email enviado para ${to}`);
  } catch (error) {
    console.error("❌ Erro ao enviar email:", error.message);

    // Log no banco com Prisma
    try {
      await prisma.userLog.create({
        data: {
          action: "Erro ao enviar email",
          newData: JSON.stringify(error, Object.getOwnPropertyNames(error)),
          createdAt: dateBRNow,
          userId:1,
        },
      });
    } catch (logErr) {
      console.error("❌ Erro ao salvar log no banco:", logErr.message);
    }
  }
};

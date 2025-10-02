import nodemailer from "nodemailer";

import dotenv from "dotenv";
dotenv.config({ path: "../.env" });

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
    console.error("Erro ao enviar email:", error);
  }
};

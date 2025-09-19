import nodemailer from "nodemailer";

// transport configurado (exemplo Gmail, mas pode ser outro)
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // STARTTLS será usado
  auth: {
    user: process.env.EMAIL_USER, // configure no .env
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Envia email para funcionário
 * @param {string} to - Email do funcionário
 * @param {string} subject - Assunto
 * @param {string} text - Texto do corpo
 */
export const enviarEmail = async (to, subject, text) => {
  try {
    await transporter.sendMail({
      from: `"Equipe e-Vestuário" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
    });
    console.log(`✅ Email enviado para ${to}`);
  } catch (error) {
    console.error("Erro ao enviar email:", error);
  }
};

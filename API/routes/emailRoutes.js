import express from "express";
import { enviarEmail } from "../emailService/emailService.js";

const router = express.Router();

router.post("/enviar-email", async (req, res) => {
  try {
    const { para, assunto, mensagem } = req.body;
    await enviarEmail({ para, assunto, mensagem });
    res.json({ success: true, message: "E-mail enviado com sucesso!" });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error);
    res.status(500).json({ success: false, message: "Falha no envio de e-mail" });
  }
});

export default router;
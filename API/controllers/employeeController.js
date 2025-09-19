// controllers/userController.js
import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";
// import { emailQueue } from "../emailService/queues/emailQueue.js";

const prisma = new PrismaClient();

export const createEmpl = async (req, res) => {
  try {
    const { name, cpf, email, sector, position, modality } = req.body;

    if (!name || !cpf || !email || !sector || !position || !modality) {
      return res
        .status(400)
        .json({ message: "Existem dados em branco, favor preencher." });
    }

    const existingEmpl = await prisma.employee.findUnique({ where: { email } });
    if (existingEmpl)
      return res.status(400).json({ message: "Email já registrado" });

    const validCpf = await prisma.employee.findUnique({ where: { cpf } });
    if (validCpf) return res.status(400).json({ message: "CPF já registrado" });

    // Dados do usuário logado
    const cadUserID = req.user.id;
    const cadUserName = req.user.name;

    const newEmpl = await prisma.employee.create({
      data: {
        name,
        cpf,
        email,
        sector,
        position,
        cadUserID,
        cadUserName,
        modality,
      },
    });

    res
      .status(201)
      .json({ success: true, message: "Funcionário criado", id: newEmpl.id });
  } catch (err) {
    if (err.code === "P2002") {
      return res
        .status(400)
        .json({ success: false, message: "CPF ou Email já cadastrado" });
    }
    console.error("Erro ao criar Funcionário:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

export const getEmpl = async (req, res) => {
  try {
    const empl = await prisma.employee.findMany({});
    res.status(200).json(empl);
  } catch (err) {
    console.error("Erro ao buscar funcionários:", err);
    res
      .status(500)
      .json({ success: false, message: "Erro ao listar funcionários" });
  }
};

export const getCpf = async (req, res) => {
  try {
    const { cpf } = req.params; // vem da URL

    const empl = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!empl) {
      return res
        .status(404)
        .json({ success: false, message: "Funcionário não encontrado." });
    }

    if (empl.active !== 1) {
      return res
        .status(400)
        .json({ success: false, message: "Funcionário inativo." });
    }

    return res.status(200).json({ success: true, data: empl });
  } catch (err) {
    console.error("Erro ao buscar funcionário:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro interno no servidor." });
  }
};

export const registrarKit = async (req, res) => {
  try {
    const { cpf, kitSize } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({ where: { cpf } });
    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    // Dados do usuário logado
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;

    // Cria a pendência
    const pendencia = await prisma.pendency.create({
      data: {
        emplID: funcionario.id,
        emplName: funcionario.name,
        userId: usuarioID,
        userName: usuarioName,
        date: new Date(),
        devolUserId: 0,
        devolUserName: "",
        devolDate: null,
        devolType: 1,
        status: 1,
        kitSize: kitSize,
      },
    });

    // Enviar e-mail automaticamente
    await enviarEmail(
      funcionario.email,
      "Retirada de Kit",
      `Olá ${funcionario.name}, seu kit de tamanho ${kitSize} foi retirado em ${new Date().toLocaleString("pt-BR")} pelo usuário ${usuarioName}.`
    );
   
    res.status(201).json({
      success: true,
      message: "Saída de kit registrada",
      pendencia,
      funcionario,
    });
  } catch (err) {
    console.error("Erro ao registrar kit:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

// Consulta pendências abertas de um funcionário pelo CPF
export const getOpenPendencies = async (req, res) => {
  try {
    const { cpf } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({ where: { cpf } });
    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    // Busca pendências com status 1
    const pendencias = await prisma.pendency.findMany({
      where: { emplID: funcionario.id, status: 1 },
      orderBy: { date: "desc" },
    });

    return res.status(200).json({
      success: true,
      total: pendencias.length,
      list: pendencias.map((p) => ({
        id: p.id,
        kitSize: p.kitSize,
        date: p.date,
      })),
    });
  } catch (err) {
    console.error("Erro ao buscar pendências:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

export const updateEmpl = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, cpf, email, sector, position, modality, active } = req.body;

    // Busca o funcionário existente
    const funcionario = await prisma.employee.findUnique({
      where: { id: Number(id) },
    });

    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "Funcionário não encontrado" });
    }

    const camposAlterados = {};
    if (name && name !== funcionario.name) camposAlterados.name = name;
    if (cpf && cpf !== funcionario.cpf) camposAlterados.cpf = cpf;
    if (email && email !== funcionario.email) camposAlterados.email = email;
    if (sector && sector !== funcionario.sector)
      camposAlterados.sector = sector;
    if (position && position !== funcionario.position)
      camposAlterados.position = position;
    if (modality && modality !== funcionario.modality)
      camposAlterados.modality = modality;
    if (active != null && Number(active) !== funcionario.active)
      camposAlterados.active = Number(active);

    if (Object.keys(camposAlterados).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo foi alterado",
      });
    }

    if (
      !name ||
      !cpf ||
      !email ||
      !sector ||
      !position ||
      !modality ||
      !active
    ) {
      return res.status(400).json({
        success: false,
        message: "Existem dados em branco, favor verificar.",
      });
    }

    // Verifica email e CPF apenas se forem alterados
    if (camposAlterados.email) {
      const emailExistente = await prisma.employee.findUnique({
        where: { email },
      });
      if (emailExistente && emailExistente.id !== Number(id)) {
        return res
          .status(400)
          .json({ success: false, message: "Email já está em uso" });
      }
    }

    if (camposAlterados.cpf) {
      const cpfExistente = await prisma.employee.findUnique({ where: { cpf } });
      if (cpfExistente && cpfExistente.id !== Number(id)) {
        return res
          .status(400)
          .json({ success: false, message: "CPF já está em uso" });
      }
    }

    // Atualiza apenas os campos alterados
    const updatedEmpl = await prisma.employee.update({
      where: { id: Number(id) },
      data: camposAlterados,
    });

    res.json({
      success: true,
      message: "Funcionário atualizado com sucesso",
      funcionario: updatedEmpl,
    });
  } catch (err) {
    console.error("Erro ao atualizar funcionário:", err);
    res.status(500).json({ success: false, message: "Erro no servidor" });
  }
};

export const devolverKit = async (req, res) => {
  try {
    const { cpf } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({ where: { cpf } });
    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    // Dados do usuário logado
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;

    // Última pendência em aberto (sem limite de tempo)
    const UltimaPendencia = await prisma.pendency.findFirst({
      where: {
        emplID: funcionario.id,
        status: 1,
      },
      orderBy: {
        date: "desc",
      },
    });

    if (!UltimaPendencia) {
      return res.json({
        success: false,
        message: "Nenhuma pendência em aberto encontrada para baixar.",
      });
    }

    // Valida prazo de 24h
    const limite = new Date();
    limite.setHours(limite.getHours() - 24);

    if (UltimaPendencia.date < limite) {
      return res.json({
        success: false,
        expired: true, 
        message: "A última pendência encontrada está fora do prazo de 24h.",
      });
    }

    // Atualiza a pendência
    const pendenciaAtualizada = await prisma.pendency.update({
      where: { id: UltimaPendencia.id },
      data: {
        status: 2,
        devolUserId: usuarioID,
        devolUserName: usuarioName,
        devolDate: new Date(),
        devolType: 2,
      },
    });

    // Envia e-mail automaticamente
    await enviarEmail(
      funcionario.email,
      "Devolução de Kit",
      `Olá ${pendenciaAtualizada.emplName}, seu kit foi devolvido em ${new Date(
        pendenciaAtualizada.devolDate
      ).toLocaleString("pt-BR")} pelo usuário ${usuarioName}.`
    );

    return res.json({
      success: true,
      message: "Última pendência baixada com sucesso.",
      pendencia: pendenciaAtualizada,
    });
  } catch (err) {
    console.error("Erro ao baixar última pendência:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
  }
};

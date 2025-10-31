// controllers/userController.js
import { PrismaClient } from "@prisma/client";
import { enviarEmail } from "../emailService/emailService.js";
import dotenv from "dotenv";
dotenv.config();

const emailCopiado = process.env.EMAIL_COPIADO;
// import { emailQueue } from "../emailService/queues/emailQueue.js";

function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

const prisma = new PrismaClient();

export const createEmpl = async (req, res) => {
  try {
    const { name, cpf, email, sector, position, modality, matricula } =
      req.body;

    if (!name || !cpf || !email || !sector || !position || !modality) {
      return res
        .status(400)
        .json({ message: "Existem dados em branco, favor preencher." });
    }

    const cadUserID = req.user.id;
    const cadUserName = req.user.name;
    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    const existingEmpl = await prisma.employee.findUnique({ where: { email } });
    if (existingEmpl) {
      if (existingEmpl.tempEmpl === 1) {
        const tempEmplReact = await prisma.employee.update({
          where: { id: existingEmpl.id },
          data: {
            name,
            email,
            sector,
            position,
            modality,
            matricula,
            active: 1,
            tempEmpl: 0,
            tempAlterDate: dateBRNow,
          },
        });

        // ------------------------------- LOG -------------------------------

        const logChanges = Object.keys(existingEmpl).reduce((acc, key) => {
          acc[key] = { old: existingEmpl[key], new: tempEmplReact[key] };
          return acc;
        }, {});

        await prisma.userLog.create({
          data: {
            userId: cadUserID,
            action: "Colaborador Temporário alterado para Permanente.",
            changes: logChanges,
            newData: tempEmplReact,
            createdAt: dateBRNow,
          },
        });

        return res.status(201).json({
          message:
            "E-mail já registrado anteriormente. Colaborador Temporário alterado para Permanente.",
          success: true,
        });
      } else {
        return res.status(400).json({
          message: "Colaborador já cadastrado no sistema.",
          success: false,
        });
      }
    } else {
      const validCpf = await prisma.employee.findUnique({ where: { cpf } });
      if (validCpf)
        return res
          .status(400)
          .json({ message: "CPF já vinculado a outro E-mail." });
    }

    // Dados do usuário logado
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
        matricula,
      },
    });

    // ---------------- LOGS ----------------
    await prisma.userLog.create({
      data: {
        userId: cadUserID, // ID do usuário que fez a criação
        action: "Criação de Funcionário", // ação
        newData: {
          name: newEmpl.name,
          email: newEmpl.email,
          sector: newEmpl.sector,
          position: newEmpl.position,
          modality: newEmpl.modality,
          matricula: newEmpl.matricula,
        },
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

    res.status(201).json({
      success: true,
      message: "Colaborador criado com sucesso.",
      id: newEmpl.id,
    });
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

export const createTempEmpl = async (req, res) => {
  try {
    const { name, cpf, email, sector, position, modality, matricula, obs } =
      req.body;
    const avatarFile = req.file; // vem do multer

    // Validação mínima
    if (!name || !cpf || !email || !sector || !position || !modality) {
      return res
        .status(400)
        .json({ message: "Existem dados em branco, favor preencher." });
    }

    if (!avatarFile) {
      return res
        .status(400)
        .json({ message: "Favor capturar a foto do colaborador." });
    }

    // Dados do usuário logado
    const cadUserID = req.user.id;
    const cadUserName = req.user.name;
    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // Verifica se funcionário já existe
    const existingEmpl = await prisma.employee.findUnique({ where: { cpf } });
    if (existingEmpl) {
      if (existingEmpl.tempEmpl === 1) {
        const tempEmplReact = await prisma.employee.update({
          where: { id: existingEmpl.id },
          data: {
            name,
            email,
            sector,
            position,
            modality,
            matricula,
            active: 1,
            tempEmplObs: obs,
            tempAlterDate: dateBRNow,
          },
        });

        // ---------------- LOG ----------------
        const logChanges = Object.keys(existingEmpl).reduce((acc, key) => {
          acc[key] = { old: existingEmpl[key], new: tempEmplReact[key] };
          return acc;
        }, {});

        await prisma.userLog.create({
          data: {
            userId: cadUserID,
            action: "Reativação de Funcionário Temporário",
            changes: logChanges,
            newData: tempEmplReact,
            createdAt: dateBRNow,
          },
        });

        return res.status(201).json({
          message:
            "Email já registrado anteriormente. Usuário Temporário Reativado.",
          success: true,
        });
      } else {
        return res.status(400).json({
          message: "Funcionário já cadastrado no sistema.",
          success: false,
        });
      }
    }

    // ---------------- Imagem ---------------

    // Cria o funcionário temporário no banco
    const newEmplTemp = await prisma.employee.create({
      data: {
        name,
        cpf,
        email,
        sector,
        position,
        cadUserID,
        cadUserName,
        modality,
        matricula,
        tempCreatedDate: dateBRNow,
        tempAlterDate: dateBRNow,
        tempEmpl: 1,
        tempEmplObs: obs,
        tempEmplImg: avatarFile ? avatarFile.filename : null, // grava só o nome do arquivo
      },
    });

    // ---------------- LOGS ----------------
    await prisma.userLog.create({
      data: {
        userId: cadUserID,
        action: "Criação de Funcionário Temporário.",
        newData: {
          name: newEmplTemp.name,
          email: newEmplTemp.email,
          sector: newEmplTemp.sector,
          position: newEmplTemp.position,
          modality: newEmplTemp.modality,
          matricula: newEmplTemp.matricula,
          tempCreatedDate: newEmplTemp.tempCreatedDate,
          tempEmpl: newEmplTemp.tempEmpl,
          tempEmplObs: newEmplTemp.tempEmplObs,
          tempEmplImg: newEmplTemp.tempEmplImg,
        },
        createdAt: dateBRNow,
      },
    });

    res.status(201).json({
      success: true,
      message: "Funcionário Temporário criado",
      id: newEmplTemp.id,
    });
  } catch (err) {
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
    const { cpf } = req.params;
    const empl = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!empl.email) {
      return res.status(200).json({
        success: false,
        emailRequired: true,
        message: "Colaborador não possui email cadastrado.",
      });
    }

    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empl.email);
    if (!emailValido) {
      return res.status(200).json({
        success: false,
        emailRequired: true,
        message: "O email cadastrado é inválido.",
      });
    }

    if (empl.active !== 1) {
      return res
        .status(200)
        .json({ success: false, message: "Colaborador inativo." });
    }

    return res.status(200).json({ success: true, data: empl });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Erro interno no servidor." });
  }
};

export const cadastrarEmail = async (req, res) => {
  try {
    const { cpf, email } = req.body;

    if (!cpf || !email) {
      return res.status(400).json({
        success: false,
        message: "CPF e email são obrigatórios.",
      });
    }

    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email inválido.",
      });
    }

    const empl = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!empl) {
      return res.status(404).json({
        success: false,
        message: "Colaborador não encontrado.",
      });
    }

    await prisma.employee.update({
      where: { cpf },
      data: { email },
    });

    return res.status(200).json({
      success: true,
      message: "Email cadastrado com sucesso.",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Erro ao cadastrar email.",
    });
  }
};

export const carregaCpfCampos = async (req, res) => {
  try {
    const { cpf } = req.params; // vem da URL

    const empl = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!empl) {
      return;
    }
    if (empl.tempEmpl !== 1) {
      return res.status(404).json({
        success: false,
        message: "Colaborador já cadastrado no sistema.",
      });
    }

    return res.status(200).json({ success: true, data: empl });
  } catch (err) {
    console.error("Erro ao buscar Colaborador:", err);
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
    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // Cria a pendência
    const pendencia = await prisma.pendency.create({
      data: {
        emplID: funcionario.id,
        emplName: funcionario.name,
        userId: usuarioID,
        userName: usuarioName,
        date: dateBRNow,
        devolUserId: 0,
        devolUserName: "",
        devolDate: null,
        devolType: 1,
        status: 1,
        kitSize: kitSize,
      },
    });

    // Enviar e-mail automaticamente
    const limiteVenc = new Date();
    limiteVenc.setHours(limiteVenc.getHours() + 36);

    const dataParaDevol = limiteVenc.toLocaleString("pt-BR");
    await enviarEmail(
      funcionario.email,
      "Retirada de Kit",
      `Olá ${funcionario.name}, seu kit de tamanho ${kitSize} foi retirado em ${new Date().toLocaleString("pt-BR")}. 
      \nPrazo para devolução: ${dataParaDevol}.`,
      emailCopiado
    );

    // ---------------- LOGS ----------------
    await prisma.userLog.create({
      data: {
        userId: usuarioID, // ID do usuário que fez a criação
        action: "Retirada de Kit", // ação
        newData: {
          emplID: pendencia.emplID,
          emplName: pendencia.emplName,
          userId: usuarioID,
          userName: usuarioName,
          kitSize: pendencia.kitSize,
        },
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

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

export const devolverKit = async (req, res) => {
  try {
    const { cpf, id } = req.body;

    // Verifica se o funcionário existe
    const funcionario = await prisma.employee.findUnique({
      where: { cpf },
    });

    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "CPF não encontrado" });
    }

    const pendenciaSelecionada = await prisma.pendency.findUnique({
      where: { id: Number(id) },
    });
    if (!pendenciaSelecionada) {
      return res
        .status(204)
        .json({ success: false, message: "Erro ao Devolver Kit." });
    }

    if (pendenciaSelecionada.emplID !== funcionario.id) {
      return res.status(200).json({
        success: false,
        message: "Essa pendência não pertence a este funcionário.",
      });
    }

    // Dados do usuário logado
    const usuarioID = req.user.id;
    const usuarioName = req.user.name;
    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // Atualiza a pendência
    const pendenciaAtualizada = await prisma.pendency.update({
      where: { id: pendenciaSelecionada.id },
      data: {
        status: 2,
        devolUserId: usuarioID,
        devolUserName: usuarioName,
        devolDate: dateBRNow,
        devolType: 2,
      },
    });

    // Envia e-mail automaticamente
    await enviarEmail(
      funcionario.email,
      "Devolução de Kit",
      `Olá ${pendenciaAtualizada.emplName}, seu kit foi devolvido com sucesso em ${new Date().toLocaleString(
        "pt-BR"
      )}. `,
      emailCopiado
    );

    // ---------------- LOGS ----------------
    await prisma.userLog.create({
      data: {
        userId: usuarioID, // ID do usuário que fez a criação
        action: "Devolução de Kit", // ação
        newData: {
          emplID: pendenciaAtualizada.emplID,
          emplName: pendenciaAtualizada.emplName,
          devolUserId: pendenciaAtualizada.devolUserId,
          devolUserName: pendenciaAtualizada.devolUserName,
          userId: usuarioID,
          userName: usuarioName,
          kitSize: pendenciaAtualizada.kitSize,
        },
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

    return res.json({
      success: true,
      message: `Pendência do dia ${new Date(
        pendenciaAtualizada.date
      ).toLocaleString(
        "pt-BR"
      )}, do colaborador ${pendenciaAtualizada.emplName} baixada com sucesso.`,
      pendencia: pendenciaAtualizada,
    });
  } catch (err) {
    console.error("Erro ao baixar última pendência:", err);
    return res
      .status(500)
      .json({ success: false, message: "Erro no servidor" });
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
    const { name, cpf, email, sector, position, modality, matricula, active } =
      req.body;

    const idUsuario = req.params.id;

    // Busca o funcionário existente
    const funcionario = await prisma.employee.findUnique({
      where: { id: Number(id) },
    });

    if (!funcionario) {
      return res
        .status(404)
        .json({ success: false, message: "Funcionário não encontrado" });
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
    if (matricula && matricula !== funcionario.matricula)
      camposAlterados.matricula = matricula;

    if (Object.keys(camposAlterados).length === 0) {
      return res.status(400).json({
        success: false,
        message: "Nenhum campo foi alterado",
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

    const dateBRNow = new Date(new Date().getTime() - 3 * 60 * 60 * 1000);

    // ---------------- LOGS ----------------
    const logChanges = Object.keys(camposAlterados).reduce((acc, key) => {
      acc[key] = { old: funcionario[key], new: updatedEmpl[key] };
      return acc;
    }, {});

    await prisma.userLog.create({
      data: {
        userId: req.user.id, // ID do usuário que fez a alteração
        action: "Alteração de Funcionário",
        changes: logChanges, // JSON criado para apresentar os campos alterados
        newData: updatedEmpl, // todo o objeto atualizado (ou pode ser só campos alterados)
        createdAt: dateBRNow,
      },
    });
    // --------------------------------------

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

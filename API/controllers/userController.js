import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import cors from 'cors';  

const app = express();
const prisma = new PrismaClient();

app.use(express.json());
app.use(cors());
app.post('/api/users', async (req, res) => {
  const { name, email, password, sector, position, level } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: 'Email já registrado' });
    }

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        sector,
        position,
        level,
      },
    });

    res.status(201).json({ message: 'Usuário criado', id: newUser.id });
  } catch (err) {
    res.status(500).json({ message: 'Erro ao criar o usuário' });
  }
});

// Rota para login do usuário

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;


//   try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (email !== user.email || password !== user.password) {
      return res.status(200).json({ message: 'Email ou senha inválidos!!!', success: false });
    }else{
      console.log(user,email, password)
       return res.status(200).json({message: 'Usuário encontrado', success: true, user: user})
    }

//     const validPassword = await bcrypt.compare(password, user.password);
//     if (!validPassword) {
//       return res.status(401).json({ message: 'Email ou senha inválidos' });
//     }

//     const token = jwt.sign({ id: user.id, email: user.email }, 'your-secret-key', { expiresIn: '1h' });
//     res.json({ token });
//   } catch (err) {
//     console.log(err)
//     res.status(500).json({ message: 'Erro ao autenticar' });
//   }
});


app.listen(3000, () => {
  console.log('Servidor rodando na porta 3000');
});

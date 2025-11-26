import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { email, name, password, role, telefone, telefone_whatsapp } = req.body;

    // Apenas admin pode criar novos usuários
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar usuários' });
    }

    // Validar role
    const validRoles = ['farmaceutico', 'chefe', 'assistente', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role inválida. Use: farmaceutico, chefe, assistente ou admin' });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Criar usuário
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role,
        telefone,
        telefone_whatsapp
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        createdAt: true
      }
    });

    res.status(201).json({ user });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    // Gerar JWT
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
};

export const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        telefone_whatsapp: true,
        active: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Me error:', error);
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

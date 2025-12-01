import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const register = async (req, res) => {
  try {
    const { email, name, password, role, telefone, telefone_whatsapp } = req.body;

    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem criar usuários' });
    }

    const validRoles = ['farmaceutico', 'chefe', 'atendente', 'admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Role inválida. Use: farmaceutico, chefe, atendente ou admin' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

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
    res.status(500).json({ error: 'Erro ao criar usuário' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user || !user.active) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

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
        role: user.role,
        firstLogin: user.firstLogin
      }
    });
  } catch (error) {
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
        firstLogin: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'A nova senha deve ter no mínimo 6 caracteres' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Senha atual incorreta' });
    }

    const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        passwordHash: newPasswordHash,
        firstLogin: false
      }
    });

    res.json({ message: 'Senha alterada com sucesso!' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao alterar senha' });
  }
};

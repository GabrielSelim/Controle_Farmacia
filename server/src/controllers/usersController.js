import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { encrypt, decrypt } from '../utils/crypto.js';

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

export const listUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        telefone_whatsapp: true,
        active: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { name: 'asc' }
    });

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar usuários' });
  }
};

export const getUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        telefone_whatsapp: true,
        active: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar usuário' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, telefone, telefone_whatsapp, callmebot_key, active, password } = req.body;

    // Apenas admin pode alterar role e active
    if ((role || active !== undefined) && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem alterar role ou status' });
    }

    // Usuários só podem editar seus próprios dados (exceto admins)
    if (req.user.role !== 'admin' && req.user.id !== id) {
      return res.status(403).json({ error: 'Você só pode editar seus próprios dados' });
    }

    const updateData = {};

    if (name !== undefined) updateData.name = name;
    if (telefone !== undefined) updateData.telefone = telefone;
    if (telefone_whatsapp !== undefined) updateData.telefone_whatsapp = telefone_whatsapp;
    
    // Apenas admin pode alterar role e active
    if (req.user.role === 'admin') {
      if (role !== undefined) updateData.role = role;
      if (active !== undefined) updateData.active = active;
    }

    // Atualizar senha se fornecida
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    }

    // Criptografar e salvar callmebot_key
    if (callmebot_key) {
      updateData.callmebot_key = encrypt(callmebot_key, process.env.CALLMEBOT_MASTER_KEY);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        telefone: true,
        telefone_whatsapp: true,
        active: true,
        updatedAt: true
      }
    });

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar usuário' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Apenas admin pode deletar
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem deletar usuários' });
    }

    // Não permitir deletar a si mesmo
    if (req.user.id === id) {
      return res.status(400).json({ error: 'Você não pode deletar sua própria conta' });
    }

    // Soft delete - apenas desativar
    await prisma.user.update({
      where: { id },
      data: { active: false }
    });

    res.json({ message: 'Usuário deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar usuário' });
  }
};

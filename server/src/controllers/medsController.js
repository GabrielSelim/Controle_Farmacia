import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const listMeds = async (req, res) => {
  try {
    const meds = await prisma.medicamento.findMany({
      orderBy: { name: 'asc' }
    });

    res.json({ meds });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao listar medicamentos' });
  }
};

export const getMed = async (req, res) => {
  try {
    const { id } = req.params;

    const med = await prisma.medicamento.findUnique({
      where: { id }
    });

    if (!med) {
      return res.status(404).json({ error: 'Medicamento não encontrado' });
    }

    res.json({ med });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar medicamento' });
  }
};

export const createMed = async (req, res) => {
  try {
    const { code, name, unit, location } = req.body;

    if (!code || !name || !unit) {
      return res.status(400).json({ error: 'Código, nome e unidade são obrigatórios' });
    }

    // Verificar se código já existe
    const existing = await prisma.medicamento.findUnique({
      where: { code }
    });

    if (existing) {
      return res.status(400).json({ error: 'Código já cadastrado' });
    }

    const med = await prisma.medicamento.create({
      data: {
        code,
        name,
        unit,
        location
      }
    });

    res.status(201).json({ med });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar medicamento' });
  }
};

export const updateMed = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, name, unit, location } = req.body;

    const updateData = {};
    
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (unit !== undefined) updateData.unit = unit;
    if (location !== undefined) updateData.location = location;

    const med = await prisma.medicamento.update({
      where: { id },
      data: updateData
    });

    res.json({ med });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar medicamento' });
  }
};

export const deleteMed = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.medicamento.delete({
      where: { id }
    });

    res.json({ message: 'Medicamento deletado com sucesso' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar medicamento' });
  }
};

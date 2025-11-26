import { sendWhatsAppToUserByEmail } from '../services/callmebot.js';
import { createCalendarEvent } from '../services/calendar.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const sendWhatsAppNotification = async (req, res) => {
  try {
    const { email, message } = req.body;

    if (!email || !message) {
      return res.status(400).json({ error: 'Email e mensagem são obrigatórios' });
    }

    // Verificar se o usuário tem permissão
    // Chefes e admins podem enviar para qualquer um
    // Farmacêuticos só podem enviar para si mesmos
    if (req.user.role === 'farmaceutico' && email !== req.user.email) {
      return res.status(403).json({ error: 'Você só pode enviar notificações para si mesmo' });
    }

    const result = await sendWhatsAppToUserByEmail(email, message);

    res.json({ 
      success: true, 
      message: 'WhatsApp enviado com sucesso',
      result 
    });
  } catch (error) {
    console.error('Send WhatsApp error:', error);
    res.status(500).json({ error: error.message || 'Erro ao enviar WhatsApp' });
  }
};

export const scheduleCalendarEvent = async (req, res) => {
  try {
    const { title, description, start, end, attendees } = req.body;

    if (!title || !start || !end) {
      return res.status(400).json({ error: 'Título, data de início e fim são obrigatórios' });
    }

    const result = await createCalendarEvent({
      title,
      description,
      start,
      end,
      attendees
    });

    res.json({ 
      success: true,
      message: 'Evento de calendário criado',
      result 
    });
  } catch (error) {
    console.error('Schedule calendar error:', error);
    res.status(500).json({ error: 'Erro ao criar evento no calendário' });
  }
};

export const notifyShift = async (req, res) => {
  try {
    const { shiftId } = req.params;

    const shift = await prisma.shift.findUnique({
      where: { id: shiftId },
      include: {
        pharmacist: true
      }
    });

    if (!shift) {
      return res.status(404).json({ error: 'Plantão não encontrado' });
    }

    if (shift.notificationSent) {
      return res.status(400).json({ error: 'Notificação já foi enviada para este plantão' });
    }

    const startDate = new Date(shift.start).toLocaleDateString('pt-BR');
    const startTime = new Date(shift.start).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    
    const message = `🏥 Lembrete de Plantão\n\nOlá ${shift.pharmacist?.name || 'Farmacêutico'}!\n\nVocê tem um plantão agendado para:\n📅 ${startDate} às ${startTime}\n\nNão esqueça de registrar a contagem de medicamentos controlados.`;

    // Enviar WhatsApp
    if (shift.pharmacist?.email) {
      try {
        await sendWhatsAppToUserByEmail(shift.pharmacist.email, message);
      } catch (error) {
        console.error('Error sending WhatsApp to pharmacist:', error);
      }
    }

    // Enviar para assistentes
    if (shift.assistants) {
      const assistantEmails = shift.assistants.split(';').map(e => e.trim());
      
      for (const email of assistantEmails) {
        try {
          await sendWhatsAppToUserByEmail(email, message);
        } catch (error) {
          console.error(`Error sending WhatsApp to ${email}:`, error);
        }
      }
    }

    // Marcar notificação como enviada
    await prisma.shift.update({
      where: { id: shiftId },
      data: { notificationSent: true }
    });

    res.json({ 
      success: true,
      message: 'Notificações enviadas com sucesso'
    });
  } catch (error) {
    console.error('Notify shift error:', error);
    res.status(500).json({ error: 'Erro ao enviar notificações do plantão' });
  }
};

import fetch from 'node-fetch';
import { PrismaClient } from '@prisma/client';
import { decrypt } from '../utils/crypto.js';

const prisma = new PrismaClient();

/**
 * Send WhatsApp message using CallMeBot API
 * @param {string} phoneWithCountry - Phone number with country code (e.g., 5516799999999)
 * @param {string} apiKey - User's CallMeBot API key
 * @param {string} message - Message to send
 */
export async function sendWhatsApp(phoneWithCountry, apiKey, message) {
  if (!phoneWithCountry || !apiKey || !message) {
    throw new Error('Phone, API key, and message are required');
  }

  // Remove any spaces or special characters from phone
  const cleanPhone = phoneWithCountry.replace(/[^\d]/g, '');

  // Encode message for URL
  const encodedMessage = encodeURIComponent(message);

  const url = `https://api.callmebot.com/whatsapp.php?phone=${cleanPhone}&text=${encodedMessage}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const text = await response.text();

    if (!response.ok) {
      console.error('CallMeBot API error:', text);
      throw new Error(`CallMeBot API returned status ${response.status}`);
    }

    console.log(`WhatsApp message sent to ${cleanPhone} (key hidden)`);
    return { success: true, response: text };
  } catch (error) {
    console.error('Error sending WhatsApp:', error.message);
    throw error;
  }
}

/**
 * Send WhatsApp message to a user by their email
 * @param {string} email - User's email
 * @param {string} message - Message to send
 */
export async function sendWhatsAppToUserByEmail(email, message) {
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      telefone: true,
      telefone_whatsapp: true,
      callmebot_key: true,
      name: true
    }
  });

  if (!user) {
    throw new Error(`Usuário com email ${email} não encontrado`);
  }

  if (!user.callmebot_key) {
    throw new Error(`Usuário ${email} não possui callmebot_key configurada`);
  }

  const phone = user.telefone_whatsapp || user.telefone;
  
  if (!phone) {
    throw new Error(`Usuário ${email} não possui telefone cadastrado`);
  }

  // Decrypt the CallMeBot key
  const decryptedKey = decrypt(user.callmebot_key, process.env.CALLMEBOT_MASTER_KEY);

  return await sendWhatsApp(phone, decryptedKey, message);
}

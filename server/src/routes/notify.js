import express from 'express';
import rateLimit from 'express-rate-limit';
import { sendWhatsAppNotification, scheduleCalendarEvent, notifyShift } from '../controllers/notifyController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

// Rate limiter para evitar abuso
const notifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 requisições por IP
  message: 'Muitas requisições de notificação. Tente novamente mais tarde.'
});

router.post('/send-whatsapp', authenticate, notifyLimiter, sendWhatsAppNotification);
router.post('/schedule-calendar', authenticate, onlyChefeOrAdmin, scheduleCalendarEvent);
router.post('/shift/:shiftId', authenticate, onlyChefeOrAdmin, notifyShift);

export default router;

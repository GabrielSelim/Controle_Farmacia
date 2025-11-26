import express from 'express';
import { createSwapRequest, listSwapRequests, respondSwapRequest, approveSwapRequest, cancelSwapRequest } from '../controllers/swapsController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Criar solicitação de troca
router.post('/', createSwapRequest);

// Listar solicitações
router.get('/', listSwapRequests);

// Responder solicitação (aceitar/recusar) - para o funcionário alvo
router.patch('/:id/respond', respondSwapRequest);

// Aprovar troca (chefe/admin)
router.patch('/:id/approve', onlyChefeOrAdmin, approveSwapRequest);

// Cancelar solicitação (próprio solicitante)
router.delete('/:id', cancelSwapRequest);

export default router;

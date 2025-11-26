import express from 'express';
import { createAbsence, listAbsences, deleteAbsence } from '../controllers/absencesController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authenticate);

// Criar ausência (chefe/admin)
router.post('/', onlyChefeOrAdmin, createAbsence);

// Listar ausências
router.get('/', listAbsences);

// Deletar ausência (chefe/admin)
router.delete('/:id', onlyChefeOrAdmin, deleteAbsence);

export default router;

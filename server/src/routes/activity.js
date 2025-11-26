import express from 'express';
import { listActivities, getActivityStats } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

// Todas as rotas requerem autenticação de chefe/admin
router.use(authenticate);
router.use(onlyChefeOrAdmin);

// Listar atividades (timeline)
router.get('/', listActivities);

// Estatísticas de atividades
router.get('/stats', getActivityStats);

export default router;

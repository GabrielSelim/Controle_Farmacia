import express from 'express';
import { listMeds, getMed, createMed, updateMed, deleteMed } from '../controllers/medsController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

router.get('/', authenticate, listMeds);
router.get('/:id', authenticate, getMed);
router.post('/', authenticate, onlyChefeOrAdmin, createMed);
router.put('/:id', authenticate, onlyChefeOrAdmin, updateMed);
router.delete('/:id', authenticate, onlyChefeOrAdmin, deleteMed);

export default router;

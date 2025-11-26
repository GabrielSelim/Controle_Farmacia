import express from 'express';
import { listShifts, getShift, createShift, updateShift, deleteShift, createRecurringShifts } from '../controllers/shiftsController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin } from '../middleware/roles.js';

const router = express.Router();

router.get('/', authenticate, listShifts);
router.get('/:id', authenticate, getShift);
router.post('/recurring', authenticate, onlyChefeOrAdmin, createRecurringShifts);
router.post('/', authenticate, onlyChefeOrAdmin, createShift);
router.put('/:id', authenticate, onlyChefeOrAdmin, updateShift);
router.delete('/:id', authenticate, onlyChefeOrAdmin, deleteShift);

export default router;

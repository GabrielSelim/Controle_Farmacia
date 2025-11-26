import express from 'express';
import { listUsers, getUser, updateUser, deleteUser } from '../controllers/usersController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyAdmin } from '../middleware/roles.js';

const router = express.Router();

router.get('/', authenticate, listUsers);
router.get('/:id', authenticate, getUser);
router.put('/:id', authenticate, updateUser);
router.delete('/:id', authenticate, onlyAdmin, deleteUser);

export default router;

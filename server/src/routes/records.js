import express from 'express';
import { 
  listRecords, 
  getRecord, 
  createRecord, 
  receiveRecord, 
  updateRecord, 
  deleteRecord,
  getAuditLogs,
  uploadPhoto
} from '../controllers/recordsController.js';
import { authenticate } from '../middleware/auth.js';
import { onlyChefeOrAdmin, onlyAdmin } from '../middleware/roles.js';
import upload from '../middleware/upload.js';

const router = express.Router();

router.get('/', authenticate, listRecords);
router.get('/audit-logs', authenticate, onlyChefeOrAdmin, getAuditLogs);
router.get('/:id', authenticate, getRecord);
router.post('/', authenticate, createRecord);
router.post('/:id/receive', authenticate, receiveRecord);
router.post('/:id/upload-photo', authenticate, upload.single('photo'), uploadPhoto);
router.put('/:id', authenticate, onlyChefeOrAdmin, updateRecord);
router.delete('/:id', authenticate, onlyAdmin, deleteRecord);

export default router;

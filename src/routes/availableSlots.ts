import { Router } from 'express';
import {
  listSlots,
  getSlot,
  createSlot,
  createManySlots,
  updateSlot,
  deleteSlot
} from '../controllers/availableSlots.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';

const router = Router();

router.get('/', listSlots);
router.get('/:id', getSlot);
router.post('/', ensureAuthenticated, createSlot);
router.post('/bulk', ensureAuthenticated, createManySlots);
router.put('/:id', ensureAuthenticated, updateSlot);
router.delete('/:id', ensureAuthenticated, deleteSlot);

export default router;

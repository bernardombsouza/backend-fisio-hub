import { Router } from 'express';
import { listProfessionals, getProfessional, getCalendar, addSlots } from '../controllers/professionals.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';

const router = Router();

router.get('/', listProfessionals);
router.get('/:id', getProfessional);
router.get('/:id/calendar', getCalendar);
router.post('/:id/slots', ensureAuthenticated, addSlots);

export default router;

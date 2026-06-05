import { Router } from 'express';
import { bookAppointment, listMyAppointments } from '../controllers/appointments.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';

const router = Router();

router.get('/', ensureAuthenticated, listMyAppointments);
router.post('/', ensureAuthenticated, bookAppointment);

export default router;

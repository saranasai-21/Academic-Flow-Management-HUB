import express from 'express';
import { createTicket, getTicketStatus, getUserTickets } from '../controllers/supportTicketController.js';

const router = express.Router();

router.post('/', createTicket);
router.get('/status/:ticketId', getTicketStatus);
router.get('/user/:email', getUserTickets);

export default router;

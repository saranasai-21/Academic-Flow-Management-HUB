import SupportTicket from '../models/SupportTicket.js';

// Generate unique ticket ID format: TK-XXXXXX
const generateTicketId = () => {
  const digits = Math.floor(100000 + Math.random() * 900000); // 6 digit number
  return `TK-${digits}`;
};

export const createTicket = async (req, res) => {
  try {
    const { userName, userEmail, userRole, category, description } = req.body;
    if (!userName || !userEmail || !userRole || !description) {
      return res.status(400).json({ message: 'Missing required ticket fields' });
    }

    let ticketId = generateTicketId();
    // Ensure uniqueness
    let exists = await SupportTicket.findOne({ ticketId });
    while (exists) {
      ticketId = generateTicketId();
      exists = await SupportTicket.findOne({ ticketId });
    }

    const ticket = await SupportTicket.create({
      ticketId,
      userName,
      userEmail: userEmail.toLowerCase(),
      userRole,
      category,
      description
    });

    res.status(201).json(ticket);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create support ticket', error: error.message });
  }
};

export const getTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required' });
    }

    // Case-insensitive lookups or simple matching
    const ticket = await SupportTicket.findOne({ ticketId: ticketId.toUpperCase().trim() });
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    res.json({
      ticketId: ticket.ticketId,
      category: ticket.category,
      description: ticket.description,
      status: ticket.status,
      createdAt: ticket.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to query ticket status', error: error.message });
  }
};

export const getUserTickets = async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ message: 'User email is required' });
    }

    const tickets = await SupportTicket.find({ userEmail: email.toLowerCase().trim() }).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve user tickets', error: error.message });
  }
};

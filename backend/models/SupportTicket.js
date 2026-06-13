import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true, trim: true },
  userName: { type: String, required: true, trim: true },
  userEmail: { type: String, required: true, trim: true },
  userRole: { type: String, enum: ['student', 'teacher'], required: true },
  category: { type: String, enum: ['Technical', 'Fees', 'Attendance', 'Other'], default: 'Other' },
  description: { type: String, required: true, trim: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved'], default: 'Open' }
}, {
  timestamps: true
});

const SupportTicket = mongoose.model('SupportTicket', SupportTicketSchema);

export default SupportTicket;

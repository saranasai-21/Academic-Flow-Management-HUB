import mongoose from 'mongoose';

const LeaveRequestSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  leaveType: { type: String, required: true, trim: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  reason: { type: String, required: true, trim: true },
  attachment: { type: String, default: '' },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending' }
}, { timestamps: true });

export default mongoose.model('LeaveRequest', LeaveRequestSchema);

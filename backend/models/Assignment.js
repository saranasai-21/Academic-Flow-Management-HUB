import mongoose from 'mongoose';

const AssignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  teacher: { type: String, required: true, trim: true },
  grade: { type: String, trim: true },
  section: { type: String, uppercase: true, trim: true },
  due: { type: Date, required: true },
  status: {
    type: String,
    enum: ['Pending', 'Submitted', 'Late Submitted', 'Checked', 'Rejected', 'Overdue'],
    default: 'Pending'
  },
  marks: { type: mongoose.Schema.Types.Mixed, default: '-' },
  totalMarks: { type: Number, default: 20 },
  gradeLetter: { type: String, default: '-' },
  description: { type: String, default: '' },
  instructions: { type: String, default: '' },
  attachment: { type: String, default: '' },
  submittedFile: { type: String, default: '' },
  answer: { type: String, default: '' },
  notes: { type: String, default: '' },
  feedback: { type: String, default: '' },
  checkedDate: { type: Date }
}, {
  timestamps: true
});

const Assignment = mongoose.model('Assignment', AssignmentSchema);

export default Assignment;

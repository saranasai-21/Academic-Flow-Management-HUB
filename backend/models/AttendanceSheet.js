import mongoose from 'mongoose';

const AttendanceRecordSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  status: { type: String, enum: ['Present', 'Absent', 'Late', 'Holiday'], required: true },
  subject: { type: String, default: 'General' },
  teacher: { type: String, default: 'Class Teacher' },
  remarks: { type: String, default: '' }
}, { _id: false });

const AttendanceSheetSchema = new mongoose.Schema({
  date: { type: Date, required: true, default: Date.now },
  grade: { type: String, required: true },
  section: { type: String, required: true, uppercase: true },
  records: [AttendanceRecordSchema]
}, {
  timestamps: true
});

// Compound unique index so attendance cannot be taken twice for the same class/section on the same date
AttendanceSheetSchema.index({ date: 1, grade: 1, section: 1 }, { unique: true });

const AttendanceSheet = mongoose.model('AttendanceSheet', AttendanceSheetSchema);

export default AttendanceSheet;

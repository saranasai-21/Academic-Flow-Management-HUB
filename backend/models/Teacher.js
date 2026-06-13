import mongoose from 'mongoose';

const TeacherSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  assignedClasses: [{ type: String, trim: true }] // e.g. ["Grade 10", "Grade 11"]
}, {
  timestamps: true
});

const Teacher = mongoose.model('Teacher', TeacherSchema);

export default Teacher;

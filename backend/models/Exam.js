import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true }, // e.g. 'Term 1 Exam', 'Final Exam'
  date: { type: Date, required: true },
  grade: { type: String, required: true, trim: true }, // Class level, e.g. 'Grade 10'
  subject: { type: String, required: true, trim: true } // Subject name, e.g. 'Mathematics'
}, {
  timestamps: true
});

const Exam = mongoose.model('Exam', ExamSchema);

export default Exam;

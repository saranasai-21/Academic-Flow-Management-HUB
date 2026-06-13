import mongoose from 'mongoose';

const SubjectSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

const Subject = mongoose.model('Subject', SubjectSchema);

export default Subject;

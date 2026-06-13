import mongoose from 'mongoose';

const ParentSchema = new mongoose.Schema({
  fatherName: { type: String, required: true, trim: true },
  motherName: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true },
  occupation: { type: String, trim: true },
  emergencyContact: { type: String, required: true, trim: true },
  linkedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Student' }]
}, {
  timestamps: true
});

const Parent = mongoose.model('Parent', ParentSchema);

export default Parent;

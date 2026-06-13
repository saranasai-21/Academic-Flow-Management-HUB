import mongoose from 'mongoose';

const ClassSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  sections: [{ type: String, uppercase: true, trim: true }],
  subjects: [{ type: String, trim: true }],
  feeAmount: { type: Number, default: 0 }
}, {
  timestamps: true
});

const Class = mongoose.model('Class', ClassSchema);

export default Class;

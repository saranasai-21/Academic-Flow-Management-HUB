import mongoose from 'mongoose';

const StudyMaterialSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  subject: { type: String, required: true, trim: true },
  type: { type: String, enum: ['PDF', 'Video', 'Notes', 'E-Book'], required: true },
  uploadedBy: { type: String, required: true, trim: true },
  grade: { type: String, trim: true },
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  rating: { type: Number, default: 4, min: 1, max: 5 },
  completed: { type: Boolean, default: false },
  url: { type: String, default: '' },
  description: { type: String, default: '' },
  bookmarked: { type: Boolean, default: false }
}, {
  timestamps: true
});

const StudyMaterial = mongoose.model('StudyMaterial', StudyMaterialSchema);

export default StudyMaterial;

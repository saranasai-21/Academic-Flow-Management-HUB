import mongoose from 'mongoose';

const SystemSettingSchema = new mongoose.Schema({
  key: { type: String, unique: true, default: 'primary' },
  schoolName: { type: String, required: true, trim: true, default: 'School Management System' },
  adminName: { type: String, required: true, trim: true, default: 'School Administrator' },
  adminEmail: { type: String, required: true, trim: true, lowercase: true, default: 'admin@school.edu' },
  academicYear: { type: String, trim: true, default: '2026-2027' },
  currency: { type: String, trim: true, default: 'INR' },
  attendanceThreshold: { type: Number, min: 0, max: 100, default: 75 }
}, { timestamps: true });

export default mongoose.model('SystemSetting', SystemSettingSchema);

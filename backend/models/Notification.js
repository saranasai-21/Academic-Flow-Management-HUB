import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  icon: { type: String, default: '📢' },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  sender: { type: String, default: 'School Admin' },
  category: {
    type: String,
    enum: ['Academic', 'Fees', 'School', 'Teacher Messages', 'Achievement'],
    default: 'School'
  },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  important: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  attachment: { type: String, default: '' },
  action: { type: String, default: 'Read Notice' },
  targetRole: { type: String, enum: ['All', 'Student', 'Teacher', 'Admin'], default: 'Student' }
}, {
  timestamps: true
});

const Notification = mongoose.model('Notification', NotificationSchema);

export default Notification;

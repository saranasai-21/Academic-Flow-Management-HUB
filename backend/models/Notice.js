import mongoose from 'mongoose';

const NoticeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  targetAudience: { 
    type: String, 
    enum: ['All', 'Students', 'Parents', 'Teachers'], 
    default: 'All' 
  },
  date: { type: Date, default: Date.now }
}, {
  timestamps: true
});

const Notice = mongoose.model('Notice', NoticeSchema);

export default Notice;

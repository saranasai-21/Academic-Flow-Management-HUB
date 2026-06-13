import Notice from '../models/Notice.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_NOTICES_FILE = path.join(__dirname, '../data/notices.json');

const isMockMode = () => false;

const readMockNotices = () => {
  try {
    if (!fs.existsSync(MOCK_NOTICES_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_NOTICES_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockNotices = (data) => {
  try {
    fs.writeFileSync(MOCK_NOTICES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
};

export const getNotices = async (req, res) => {
  try {
    if (isMockMode()) {
      const notices = readMockNotices();
      // Sort notices by date descending
      notices.sort((a, b) => new Date(b.date) - new Date(a.date));
      return res.status(200).json(notices);
    }
    const notices = await Notice.find().sort({ date: -1 });
    res.status(200).json(notices);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notices', error: error.message });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, content, targetAudience } = req.body;
    if (!title || !content) {
      return res.status(400).json({ message: 'Notice title and content are required' });
    }

    if (isMockMode()) {
      const notices = readMockNotices();
      const newNotice = {
        _id: new Date().getTime().toString(16),
        title,
        content,
        targetAudience: targetAudience || 'All',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      notices.push(newNotice);
      writeMockNotices(notices);
      return res.status(201).json(newNotice);
    }

    const newNotice = new Notice({ title, content, targetAudience });
    await newNotice.save();
    res.status(201).json(newNotice);
  } catch (error) {
    res.status(400).json({ message: 'Error creating school notice', error: error.message });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      let notices = readMockNotices();
      if (!notices.some(n => n._id === id)) return res.status(404).json({ message: 'Notice not found' });
      notices = notices.filter(n => n._id !== id);
      writeMockNotices(notices);
      return res.status(200).json({ message: 'Notice deleted successfully' });
    }

    const deleted = await Notice.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Notice not found' });
    res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting notice', error: error.message });
  }
};

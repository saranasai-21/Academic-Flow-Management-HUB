import Notification from '../models/Notification.js';
import Notice from '../models/Notice.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_NOTIFICATIONS_FILE = path.join(__dirname, '../data/notifications.json');
const MOCK_NOTICES_FILE = path.join(__dirname, '../data/notices.json');
const isMockMode = () => false;

const defaultNotifications = [
  { _id: 'notif-1', icon: '📢', title: 'Mid-Term Exam Schedule Released', description: 'Mid-term exams start from 20 June 2026.', sender: 'Exam Cell', category: 'Academic', priority: 'High', important: true, read: false, attachment: 'mid-term-timetable.pdf', action: 'Download Hall Ticket', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'notif-2', icon: '📚', title: 'New Mathematics Assignment Uploaded', description: 'Algebra assignment has been uploaded by Ravi Sir.', sender: 'Ravi Sir', category: 'Academic', priority: 'Medium', important: false, read: false, attachment: 'algebra-assignment.pdf', action: 'View Assignment', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'notif-3', icon: '💰', title: 'Fee Due Reminder', description: 'Your next fee installment is due on 30 June 2026.', sender: 'Accounts Department', category: 'Fees', priority: 'High', important: true, read: false, attachment: 'fee-statement.pdf', action: 'Pay Fee', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date().toISOString() },
  { _id: 'notif-4', icon: '🏆', title: 'Rank 3 in Mathematics Test', description: 'Congratulations! You secured Rank 3 in Mathematics Test.', sender: 'Academic Cell', category: 'Achievement', priority: 'Medium', important: false, read: true, attachment: '', action: 'View Result', createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date().toISOString() }
];

const readJson = (file, fallback = []) => {
  try {
    if (!fs.existsSync(file)) return fallback;
    return JSON.parse(fs.readFileSync(file, 'utf-8'));
  } catch (err) {
    return fallback;
  }
};

const readMockNotifications = () => {
  if (!fs.existsSync(MOCK_NOTIFICATIONS_FILE)) {
    fs.writeFileSync(MOCK_NOTIFICATIONS_FILE, JSON.stringify(defaultNotifications, null, 2), 'utf-8');
  }
  return readJson(MOCK_NOTIFICATIONS_FILE, defaultNotifications);
};

const writeMockNotifications = (data) => {
  fs.writeFileSync(MOCK_NOTIFICATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const noticeToNotification = (notice) => ({
  _id: `notice-${notice._id}`,
  icon: '🏫',
  title: notice.title,
  description: notice.content,
  sender: 'School Admin',
  category: 'School',
  priority: 'Medium',
  important: false,
  read: true,
  attachment: 'notice-circular.pdf',
  action: 'Read Notice',
  createdAt: notice.date || notice.createdAt,
  updatedAt: notice.updatedAt || notice.date
});

export const getNotifications = async (req, res) => {
  try {
    if (isMockMode()) {
      const notifications = readMockNotifications();
      const notices = readJson(MOCK_NOTICES_FILE, []).map(noticeToNotification);
      const merged = [...notifications, ...notices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return res.status(200).json(merged);
    }

    const [notifications, notices] = await Promise.all([
      Notification.find({ targetRole: { $in: ['All', 'Student'] } }).sort({ createdAt: -1 }),
      Notice.find({ targetAudience: { $in: ['All', 'Students'] } }).sort({ date: -1 })
    ]);
    res.status(200).json([...notifications, ...notices.map(noticeToNotification)]);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications', error: error.message });
  }
};

export const createNotification = async (req, res) => {
  try {
    if (isMockMode()) {
      const notifications = readMockNotifications();
      const notification = {
        _id: new Date().getTime().toString(16),
        ...req.body,
        read: req.body.read || false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      notifications.push(notification);
      writeMockNotifications(notifications);
      return res.status(201).json(notification);
    }

    const notification = await Notification.create(req.body);
    res.status(201).json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error creating notification', error: error.message });
  }
};

export const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      const notifications = readMockNotifications();
      const idx = notifications.findIndex(item => item._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Notification not found' });
      notifications[idx].read = true;
      notifications[idx].updatedAt = new Date().toISOString();
      writeMockNotifications(notifications);
      return res.status(200).json(notifications[idx]);
    }

    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.status(200).json(notification);
  } catch (error) {
    res.status(400).json({ message: 'Error marking notification read', error: error.message });
  }
};

export const markAllNotificationsRead = async (req, res) => {
  try {
    if (isMockMode()) {
      const notifications = readMockNotifications().map(item => ({ ...item, read: true, updatedAt: new Date().toISOString() }));
      writeMockNotifications(notifications);
      return res.status(200).json({ message: 'All notifications marked as read' });
    }

    await Notification.updateMany({ targetRole: { $in: ['All', 'Student'] } }, { read: true });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(400).json({ message: 'Error marking notifications read', error: error.message });
  }
};

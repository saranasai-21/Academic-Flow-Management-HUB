import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Assignment from '../models/Assignment.js';
import AttendanceSheet from '../models/AttendanceSheet.js';
import Exam from '../models/Exam.js';
import LeaveRequest from '../models/LeaveRequest.js';
import Notification from '../models/Notification.js';
import Notice from '../models/Notice.js';
import Student from '../models/Student.js';
import StudyMaterial from '../models/StudyMaterial.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFile = name => path.join(__dirname, `../data/${name}.json`);
const isMockMode = () => false;

const readJson = (name, fallback = []) => {
  try {
    const file = dataFile(name);
    return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf-8')) : fallback;
  } catch {
    return fallback;
  }
};

const writeJson = (name, value) => {
  fs.writeFileSync(dataFile(name), JSON.stringify(value, null, 2), 'utf-8');
};

const matchesStudent = (recordStudent, studentId) => {
  const value = recordStudent?._id || recordStudent;
  return String(value) === String(studentId);
};

const noticeToNotification = notice => ({
  _id: `notice-${notice._id}`,
  title: notice.title,
  description: notice.content,
  sender: 'School Admin',
  category: 'School',
  priority: 'Medium',
  important: false,
  read: true,
  attachment: '',
  action: 'Read Notice',
  createdAt: notice.date || notice.createdAt
});

const buildAttendance = (sheets, studentId) => {
  const records = sheets.flatMap(sheet => {
    const record = (sheet.records || []).find(item => matchesStudent(item.student, studentId));
    return record ? [{
      date: sheet.date,
      status: record.status,
      subject: record.subject || 'General',
      teacher: record.teacher || 'Class Teacher',
      remarks: record.remarks || (record.status === 'Present' ? 'On time' : 'Attendance exception')
    }] : [];
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const summary = records.reduce((acc, record) => {
    acc.totalDays += 1;
    if (record.status === 'Present') acc.presentDays += 1;
    else if (record.status === 'Late') acc.lateDays += 1;
    else acc.absentDays += 1;
    return acc;
  }, { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0 });
  summary.rate = summary.totalDays ? Math.round((summary.presentDays / summary.totalDays) * 100) : 0;

  return { records, summary };
};

const findMockStudent = query => {
  const students = readJson('students');
  if (query.studentId) return students.find(item => item._id === query.studentId);
  if (query.email) return students.find(item => item.email?.toLowerCase() === query.email.toLowerCase());
  return students[0];
};

export const getStudentPortal = async (req, res) => {
  try {
    if (isMockMode()) {
      const student = findMockStudent(req.query);
      if (!student) return res.status(404).json({ message: 'Student profile not found' });

      const attendance = buildAttendance(readJson('attendance'), student._id);
      const notices = readJson('notices').filter(item => ['All', 'Students'].includes(item.targetAudience || 'All'));
      const notifications = [
        ...readJson('notifications').filter(item => ['All', 'Student'].includes(item.targetRole || 'Student')),
        ...notices.map(noticeToNotification)
      ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      return res.json({
        student,
        attendance,
        exams: readJson('exams').filter(item => item.grade === student.grade),
        assignments: readJson('assignments').filter(item => item.grade === student.grade && (!item.section || item.section === student.section)),
        materials: readJson('materials').filter(item => !item.grade || item.grade === 'All' || item.grade === student.grade),
        notices,
        notifications,
        leaveRequests: readJson('leaveRequests').filter(item => item.student === student._id)
      });
    }

    const studentQuery = req.query.studentId ? { _id: req.query.studentId } : req.query.email ? { email: req.query.email.toLowerCase() } : {};
    const student = await Student.findOne(studentQuery).populate('parent');
    if (!student) return res.status(404).json({ message: 'Student profile not found' });

    const [sheets, exams, assignments, materials, notices, notifications, leaveRequests] = await Promise.all([
      AttendanceSheet.find({ 'records.student': student._id }).sort({ date: -1 }),
      Exam.find({ grade: student.grade }).sort({ examDate: 1 }),
      Assignment.find({ grade: student.grade, $or: [{ section: student.section }, { section: { $in: ['', null] } }] }).sort({ due: 1 }),
      StudyMaterial.find({ $or: [{ grade: student.grade }, { grade: 'All' }, { grade: { $in: ['', null] } }] }).sort({ uploadDate: -1 }),
      Notice.find({ targetAudience: { $in: ['All', 'Students'] } }).sort({ date: -1 }),
      Notification.find({ targetRole: { $in: ['All', 'Student'] } }).sort({ createdAt: -1 }),
      LeaveRequest.find({ student: student._id }).sort({ createdAt: -1 })
    ]);

    res.json({
      student,
      attendance: buildAttendance(sheets, student._id),
      exams,
      assignments,
      materials,
      notices,
      notifications: [...notifications, ...notices.map(noticeToNotification)].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
      leaveRequests
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading student portal', error: error.message });
  }
};

export const createLeaveRequest = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { leaveType, fromDate, toDate, reason, attachment = '' } = req.body;
    if (!leaveType || !fromDate || !toDate || !reason) return res.status(400).json({ message: 'Leave type, dates and reason are required' });
    if (new Date(toDate) < new Date(fromDate)) return res.status(400).json({ message: 'To date cannot be before from date' });

    if (isMockMode()) {
      const requests = readJson('leaveRequests');
      const request = { _id: Date.now().toString(16), student: studentId, leaveType, fromDate, toDate, reason, attachment, status: 'Pending', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      requests.push(request);
      writeJson('leaveRequests', requests);
      return res.status(201).json(request);
    }

    const request = await LeaveRequest.create({ student: studentId, leaveType, fromDate, toDate, reason, attachment });
    res.status(201).json(request);
  } catch (error) {
    res.status(400).json({ message: 'Error applying leave', error: error.message });
  }
};

export const recordFeePayment = async (req, res) => {
  try {
    const { studentId } = req.params;
    const amount = Number(req.body.amount);
    const paymentMethod = req.body.paymentMethod || 'UPI';
    if (!amount || amount <= 0) return res.status(400).json({ message: 'Enter a valid payment amount' });

    if (isMockMode()) {
      const students = readJson('students');
      const index = students.findIndex(item => item._id === studentId);
      if (index === -1) return res.status(404).json({ message: 'Student not found' });
      const student = students[index];
      const pending = Math.max(Number(student.finance?.totalFees || 0) - Number(student.finance?.feesPaid || 0), 0);
      if (amount > pending) return res.status(400).json({ message: 'Payment exceeds pending balance' });
      const payment = { receiptNumber: `REC-${Date.now()}`, amount, date: new Date().toISOString(), paymentMethod, status: 'Paid' };
      student.finance = student.finance || { totalFees: 0, feesPaid: 0, paymentHistory: [] };
      student.finance.feesPaid = Number(student.finance.feesPaid || 0) + amount;
      student.finance.outstandingBalance = Math.max(Number(student.finance.totalFees || 0) - student.finance.feesPaid, 0);
      student.finance.paymentHistory = [...(student.finance.paymentHistory || []), payment];
      student.updatedAt = new Date().toISOString();
      students[index] = student;
      writeJson('students', students);
      return res.status(201).json({ student, payment });
    }

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    const pending = Math.max(student.finance.totalFees - student.finance.feesPaid, 0);
    if (amount > pending) return res.status(400).json({ message: 'Payment exceeds pending balance' });
    const payment = { amount, date: new Date(), paymentMethod, status: 'Paid' };
    student.finance.feesPaid += amount;
    student.finance.paymentHistory.push(payment);
    await student.save();
    res.status(201).json({ student, payment: student.finance.paymentHistory.at(-1) });
  } catch (error) {
    res.status(400).json({ message: 'Error recording fee payment', error: error.message });
  }
};

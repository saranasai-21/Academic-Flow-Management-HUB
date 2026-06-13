import AttendanceSheet from '../models/AttendanceSheet.js';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_ATTENDANCE_FILE = path.join(__dirname, '../data/attendance.json');
const MOCK_STUDENTS_FILE = path.join(__dirname, '../data/students.json');

const isMockMode = () => false;

// Mock File Helpers
const readMockAttendance = () => {
  try {
    if (!fs.existsSync(MOCK_ATTENDANCE_FILE)) return [];
    const data = fs.readFileSync(MOCK_ATTENDANCE_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read attendance mock DB:', err);
    return [];
  }
};

const writeMockAttendance = (data) => {
  try {
    fs.writeFileSync(MOCK_ATTENDANCE_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write attendance mock DB:', err);
  }
};

const readMockStudents = () => {
  try {
    if (!fs.existsSync(MOCK_STUDENTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_STUDENTS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockStudents = (data) => {
  try {
    fs.writeFileSync(MOCK_STUDENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(err);
  }
};

// Normalize Date to start of day (UTC)
const normalizeDate = (dateStr) => {
  const d = new Date(dateStr);
  d.setUTCHours(0, 0, 0, 0);
  return d;
};

// Get students for a class/section
export const getStudentsForAttendance = async (req, res) => {
  try {
    const { grade, section } = req.query;
    if (!grade || !section) {
      return res.status(400).json({ message: 'Grade and Section parameters are required' });
    }

    if (isMockMode()) {
      const students = readMockStudents();
      const filtered = students
        .filter(s => s.grade === grade && s.section === section.toUpperCase() && s.status === 'Active')
        .map(s => ({
          _id: s._id,
          name: s.name,
          rollNumber: s.rollNumber,
          registerNumber: s.registerNumber
        }));
      return res.status(200).json(filtered);
    }

    // MongoDB Mode
    const students = await Student.find({
      grade,
      section: section.toUpperCase(),
      status: 'Active'
    }).select('name rollNumber registerNumber').sort({ name: 1 });
    
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students for attendance', error: error.message });
  }
};

// Get attendance sheet for class, section and date
export const getAttendanceSheet = async (req, res) => {
  try {
    const { grade, section, date, student } = req.query;
    if (student) {
      const sheets = isMockMode()
        ? readMockAttendance()
        : await AttendanceSheet.find({ 'records.student': student }).sort({ date: -1 });
      const records = sheets.flatMap(sheet => {
        const record = (sheet.records || []).find(item => String(item.student?._id || item.student) === String(student));
        return record ? [{
          date: sheet.date,
          status: record.status,
          subject: record.subject || 'General',
          teacher: record.teacher || 'Class Teacher',
          remarks: record.remarks || (record.status === 'Present' ? 'On time' : 'Attendance exception')
        }] : [];
      }).sort((a, b) => new Date(b.date) - new Date(a.date));
      const summary = records.reduce((result, record) => {
        result.totalDays += 1;
        if (record.status === 'Present') result.presentDays += 1;
        else if (record.status === 'Late') result.lateDays += 1;
        else result.absentDays += 1;
        return result;
      }, { totalDays: 0, presentDays: 0, absentDays: 0, lateDays: 0 });
      summary.rate = summary.totalDays ? Math.round((summary.presentDays / summary.totalDays) * 100) : 0;
      return res.status(200).json({ records, summary });
    }
    if (!grade || !section || !date) {
      return res.status(400).json({ message: 'Grade, Section and Date parameters are required' });
    }

    const queryDate = normalizeDate(date);

    if (isMockMode()) {
      const sheets = readMockAttendance();
      const sheet = sheets.find(s => 
        s.grade === grade && 
        s.section === section.toUpperCase() && 
        new Date(s.date).getTime() === queryDate.getTime()
      );
      return res.status(200).json(sheet || null);
    }

    // MongoDB Mode
    const nextDay = new Date(queryDate);
    nextDay.setUTCDate(queryDate.getUTCDate() + 1);

    const sheet = await AttendanceSheet.findOne({
      grade,
      section: section.toUpperCase(),
      date: {
        $gte: queryDate,
        $lt: nextDay
      }
    });

    res.status(200).json(sheet);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance sheet', error: error.message });
  }
};

// Submit attendance (create or update)
export const submitAttendance = async (req, res) => {
  try {
    const { date, grade, section, records } = req.body;
    if (!date || !grade || !section || !records) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    const queryDate = normalizeDate(date);

    if (isMockMode()) {
      const sheets = readMockAttendance();
      const students = readMockStudents();

      // Find existing sheet
      const sheetIndex = sheets.findIndex(s => 
        s.grade === grade && 
        s.section === section.toUpperCase() && 
        new Date(s.date).getTime() === queryDate.getTime()
      );

      const oldSheet = sheetIndex !== -1 ? sheets[sheetIndex] : null;

      // Adjust Student Stats
      records.forEach(rec => {
        const studentIdx = students.findIndex(s => s._id === rec.student);
        if (studentIdx === -1) return;

        const student = students[studentIdx];
        if (!student.attendance) {
          student.attendance = { presentDays: 0, totalDays: 0, rate: 0 };
        }

        const oldRecord = oldSheet ? oldSheet.records.find(r => r.student === rec.student) : null;

        if (oldRecord) {
          // Updating existing attendance sheet
          if (oldRecord.status !== rec.status) {
            if (rec.status === 'Present') {
              student.attendance.presentDays += 1;
            } else {
              student.attendance.presentDays -= 1;
            }
          }
          // totalDays stays the same since the sheet already existed
        } else {
          // Creating a new attendance sheet entry for this student
          student.attendance.totalDays += 1;
          if (rec.status === 'Present') {
            student.attendance.presentDays += 1;
          }
        }

        // Re-calculate rate
        if (student.attendance.totalDays > 0) {
          student.attendance.rate = Math.round((student.attendance.presentDays / student.attendance.totalDays) * 100);
        } else {
          student.attendance.rate = 0;
        }

        students[studentIdx] = student;
      });

      // Update mock database files
      const newSheet = {
        _id: oldSheet ? oldSheet._id : new Date().getTime().toString(16),
        date: queryDate.toISOString(),
        grade,
        section: section.toUpperCase(),
        records,
        createdAt: oldSheet ? oldSheet.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (oldSheet) {
        sheets[sheetIndex] = newSheet;
      } else {
        sheets.push(newSheet);
      }

      writeMockAttendance(sheets);
      writeMockStudents(students);

      return res.status(200).json({ message: 'Attendance submitted successfully (Local DB)', sheet: newSheet });
    }

    // MongoDB Mode
    const nextDay = new Date(queryDate);
    nextDay.setUTCDate(queryDate.getUTCDate() + 1);

    let oldSheet = await AttendanceSheet.findOne({
      grade,
      section: section.toUpperCase(),
      date: {
        $gte: queryDate,
        $lt: nextDay
      }
    });

    // Process adjustments for students
    for (const rec of records) {
      const student = await Student.findById(rec.student);
      if (!student) continue;

      if (!student.attendance) {
        student.attendance = { presentDays: 0, totalDays: 0, rate: 0 };
      }

      const oldRecord = oldSheet ? oldSheet.records.find(r => r.student.toString() === rec.student) : null;

      if (oldRecord) {
        if (oldRecord.status !== rec.status) {
          if (rec.status === 'Present') {
            student.attendance.presentDays += 1;
          } else {
            student.attendance.presentDays -= 1;
          }
        }
      } else {
        student.attendance.totalDays += 1;
        if (rec.status === 'Present') {
          student.attendance.presentDays += 1;
        }
      }

      // Recalculate rate
      if (student.attendance.totalDays > 0) {
        student.attendance.rate = Math.round((student.attendance.presentDays / student.attendance.totalDays) * 100);
      } else {
        student.attendance.rate = 0;
      }

      await student.save();
    }

    let savedSheet;
    if (oldSheet) {
      oldSheet.records = records;
      savedSheet = await oldSheet.save();
    } else {
      const newSheet = new AttendanceSheet({
        date: queryDate,
        grade,
        section: section.toUpperCase(),
        records
      });
      savedSheet = await newSheet.save();
    }

    res.status(200).json({ message: 'Attendance recorded successfully', sheet: savedSheet });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting attendance records', error: error.message });
  }
};

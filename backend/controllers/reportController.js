import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_STUDENTS_FILE = path.join(__dirname, '../data/students.json');
const MOCK_TEACHERS_FILE = path.join(__dirname, '../data/teachers.json');
const MOCK_CLASSES_FILE = path.join(__dirname, '../data/classes.json');

const isMockMode = () => false;

const readMockData = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch (err) {
    return [];
  }
};

export const getReportsData = async (req, res) => {
  try {
    if (isMockMode()) {
      const students = readMockData(MOCK_STUDENTS_FILE);
      const teachers = readMockData(MOCK_TEACHERS_FILE);
      const classes = readMockData(MOCK_CLASSES_FILE);

      // 1. Fee Pending Students
      const feePendingStudents = students
        .filter(s => s.finance && (s.finance.totalFees - s.finance.feesPaid) > 0)
        .map(s => ({
          _id: s._id,
          name: s.name,
          rollNumber: s.rollNumber,
          grade: s.grade,
          section: s.section,
          totalFees: s.finance.totalFees,
          feesPaid: s.finance.feesPaid,
          pending: s.finance.totalFees - s.finance.feesPaid
        }))
        .sort((a, b) => b.pending - a.pending);

      // 2. Class-wise Performance & Attendance averages
      const classStatsMap = {};
      classes.forEach(c => {
        classStatsMap[c.name] = { totalPercentage: 0, totalAttendance: 0, studentCount: 0 };
      });

      students.forEach(s => {
        if (!classStatsMap[s.grade]) {
          classStatsMap[s.grade] = { totalPercentage: 0, totalAttendance: 0, studentCount: 0 };
        }
        classStatsMap[s.grade].totalPercentage += Number(s.percentage) || 0;
        classStatsMap[s.grade].totalAttendance += Number(s.attendance?.rate) || 0;
        classStatsMap[s.grade].studentCount += 1;
      });

      const classReports = Object.keys(classStatsMap).map(className => {
        const stats = classStatsMap[className];
        return {
          className,
          studentCount: stats.studentCount,
          avgPercentage: stats.studentCount > 0 ? Math.round((stats.totalPercentage / stats.studentCount) * 10) / 10 : 0,
          avgAttendance: stats.studentCount > 0 ? Math.round((stats.totalAttendance / stats.studentCount) * 10) / 10 : 0
        };
      }).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' }));

      // 3. Top Performing Students
      const topStudents = [...students]
        .filter(s => s.status === 'Active')
        .sort((a, b) => (b.percentage || 0) - (a.percentage || 0))
        .slice(0, 5)
        .map(s => ({
          _id: s._id,
          name: s.name,
          rollNumber: s.rollNumber,
          grade: s.grade,
          section: s.section,
          percentage: s.percentage
        }));

      // 4. Summaries
      const totalStudentsCount = students.length;
      const totalTeachersCount = teachers.length;
      const totalClassesCount = classes.length;
      const pendingFeesCount = feePendingStudents.length;

      return res.status(200).json({
        summary: {
          totalStudents: totalStudentsCount,
          totalTeachers: totalTeachersCount,
          totalClasses: totalClassesCount,
          pendingFeesCount
        },
        feePendingStudents,
        classReports,
        topStudents
      });
    }

    // MongoDB Mode
    const students = await Student.find();
    const teachers = await Teacher.countDocuments();
    const classes = await Class.find();

    const feePendingStudents = await Student.find({ 'finance.outstandingBalance': { $gt: 0 } })
      .select('name rollNumber grade section finance')
      .sort({ 'finance.outstandingBalance': -1 });

    const topStudents = await Student.find({ status: 'Active' })
      .select('name rollNumber grade section percentage')
      .sort({ percentage: -1 })
      .limit(5);

    const classStatsMap = {};
    classes.forEach(c => {
      classStatsMap[c.name] = { totalPercentage: 0, totalAttendance: 0, studentCount: 0 };
    });

    students.forEach(s => {
      if (!classStatsMap[s.grade]) {
        classStatsMap[s.grade] = { totalPercentage: 0, totalAttendance: 0, studentCount: 0 };
      }
      classStatsMap[s.grade].totalPercentage += s.percentage || 0;
      classStatsMap[s.grade].totalAttendance += s.attendance?.rate || 0;
      classStatsMap[s.grade].studentCount += 1;
    });

    const classReports = Object.keys(classStatsMap).map(className => {
      const stats = classStatsMap[className];
      return {
        className,
        studentCount: stats.studentCount,
        avgPercentage: stats.studentCount > 0 ? Math.round((stats.totalPercentage / stats.studentCount) * 10) / 10 : 0,
        avgAttendance: stats.studentCount > 0 ? Math.round((stats.totalAttendance / stats.studentCount) * 10) / 10 : 0
      };
    }).sort((a, b) => a.className.localeCompare(b.className, undefined, { numeric: true, sensitivity: 'base' }));

    res.status(200).json({
      summary: {
        totalStudents: students.length,
        totalTeachers: teachers,
        totalClasses: classes.length,
        pendingFeesCount: feePendingStudents.length
      },
      feePendingStudents: feePendingStudents.map(s => ({
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        grade: s.grade,
        section: s.section,
        totalFees: s.finance.totalFees,
        feesPaid: s.finance.feesPaid,
        pending: s.finance.outstandingBalance
      })),
      classReports,
      topStudents
    });
  } catch (error) {
    res.status(500).json({ message: 'Error generating reports analytics', error: error.message });
  }
};

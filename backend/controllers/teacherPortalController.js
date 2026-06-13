import Assignment from '../models/Assignment.js';
import AttendanceSheet from '../models/AttendanceSheet.js';
import Exam from '../models/Exam.js';
import Notice from '../models/Notice.js';
import Notification from '../models/Notification.js';
import Student from '../models/Student.js';
import StudyMaterial from '../models/StudyMaterial.js';
import Teacher from '../models/Teacher.js';

const subjectAliases = subject => {
  const value = String(subject || '').toLowerCase();
  if (value.includes('math')) return ['maths', 'mathematics'];
  if (value.includes('science')) return ['science', 'general science'];
  return [value];
};

const subjectMatches = (value, subject) => subjectAliases(subject).some(alias => String(value || '').toLowerCase().includes(alias));

export const getTeacherPortal = async (req, res) => {
  try {
    const teacher = req.query.teacherId
      ? await Teacher.findById(req.query.teacherId)
      : await Teacher.findOne(req.query.email ? { email: req.query.email.toLowerCase() } : {}).sort({ name: 1 });

    if (!teacher) return res.status(404).json({ message: 'Teacher profile not found' });

    const assignedClasses = teacher.assignedClasses || [];
    const [students, allAssignments, allExams, allMaterials, attendanceSheets, notices, notifications] = await Promise.all([
      Student.find({ grade: { $in: assignedClasses }, status: 'Active' }).sort({ grade: 1, section: 1, name: 1 }),
      Assignment.find({ grade: { $in: assignedClasses } }).sort({ due: 1 }),
      Exam.find({ grade: { $in: assignedClasses } }).sort({ date: 1 }),
      StudyMaterial.find({ grade: { $in: [...assignedClasses, 'All'] } }).sort({ uploadDate: -1 }),
      AttendanceSheet.find({ grade: { $in: assignedClasses } }).sort({ date: -1 }).limit(60),
      Notice.find().sort({ date: -1 }).limit(20),
      Notification.find({ sender: teacher.name }).sort({ createdAt: -1 }).limit(20)
    ]);

    const assignments = allAssignments.filter(item => subjectMatches(item.subject, teacher.subject) || item.teacher === teacher.name);
    const exams = allExams.filter(item => subjectMatches(item.subject, teacher.subject));
    const materials = allMaterials.filter(item => subjectMatches(item.subject, teacher.subject) || item.uploadedBy === teacher.name);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceSummary = assignedClasses.map(grade => {
      const classSheets = attendanceSheets.filter(sheet => sheet.grade === grade);
      const latest = classSheets[0];
      return {
        grade,
        lastMarked: latest?.date || null,
        sheets: classSheets.length,
        present: latest?.records?.filter(record => record.status === 'Present').length || 0,
        total: latest?.records?.length || 0
      };
    });

    res.json({
      teacher,
      students,
      assignments,
      exams,
      materials,
      attendanceSheets,
      attendanceSummary,
      notices,
      notifications,
      dashboard: {
        assignedClasses: assignedClasses.length,
        students: students.length,
        pendingReviews: assignments.filter(item => ['Submitted', 'Late Submitted'].includes(item.status)).length,
        upcomingExams: exams.filter(item => new Date(item.date) >= today).length,
        averageAttendance: students.length
          ? Math.round(students.reduce((sum, student) => sum + Number(student.attendance?.rate || 0), 0) / students.length)
          : 0,
        averageScore: students.length
          ? Math.round(students.reduce((sum, student) => sum + Number(student.percentage || 0), 0) / students.length)
          : 0
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error loading teacher portal', error: error.message });
  }
};

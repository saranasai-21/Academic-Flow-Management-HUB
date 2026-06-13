import Exam from '../models/Exam.js';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_EXAMS_FILE = path.join(__dirname, '../data/exams.json');
const MOCK_STUDENTS_FILE = path.join(__dirname, '../data/students.json');

const isMockMode = () => false;

const readMockExams = () => {
  try {
    if (!fs.existsSync(MOCK_EXAMS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_EXAMS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockExams = (data) => {
  try {
    fs.writeFileSync(MOCK_EXAMS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
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
  } catch (err) {}
};

// Calculate letter grade based on marks
const calculateGradeLetter = (marks) => {
  const m = Number(marks) || 0;
  if (m >= 90) return 'A+';
  if (m >= 80) return 'A';
  if (m >= 70) return 'B';
  if (m >= 60) return 'C';
  if (m >= 50) return 'D';
  return 'F';
};

// Recalculate student percentage (mimics mongoose pre-save)
const updateStudentPercentage = (student) => {
  if (student.grades && student.grades.length > 0) {
    let sum = 0;
    student.grades.forEach(g => {
      sum += Number(g.marks) || 0;
    });
    student.percentage = Math.round((sum / student.grades.length) * 100) / 100;
  } else {
    student.percentage = 0;
  }
  return student;
};

export const getExams = async (req, res) => {
  try {
    if (isMockMode()) {
      const exams = readMockExams();
      // Filter by grade if provided
      const filteredExams = req.query.grade
        ? exams.filter(exam => exam.grade === req.query.grade)
        : exams;
      return res.status(200).json(filteredExams);
    }
    const query = {};
    if (req.query.grade && req.query.grade !== 'All') {
      query.grade = req.query.grade;
    }
    const exams = await Exam.find(query).sort({ date: 1 });
    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching exams', error: error.message });
  }
};

export const createExam = async (req, res) => {
  try {
    const { name, date, grade, subject } = req.body;
    if (!name || !date || !grade || !subject) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (isMockMode()) {
      const exams = readMockExams();
      const newExam = {
        _id: new Date().getTime().toString(16),
        name,
        date: new Date(date).toISOString(),
        grade,
        subject,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      exams.push(newExam);
      writeMockExams(exams);
      return res.status(201).json(newExam);
    }

    const newExam = new Exam({ name, date, grade, subject });
    await newExam.save();
    res.status(201).json(newExam);
  } catch (error) {
    res.status(400).json({ message: 'Error creating exam schedule', error: error.message });
  }
};

export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      let exams = readMockExams();
      if (!exams.some(e => e._id === id)) return res.status(404).json({ message: 'Exam schedule not found' });
      exams = exams.filter(e => e._id !== id);
      writeMockExams(exams);
      return res.status(200).json({ message: 'Exam deleted successfully' });
    }

    const deleted = await Exam.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Exam schedule not found' });
    res.status(200).json({ message: 'Exam deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting exam', error: error.message });
  }
};

// Batch upload student marks for an exam
export const submitExamMarks = async (req, res) => {
  try {
    const { term, subject, grade, marksRecords } = req.body; // marksRecords: [{ studentId, marks }]
    if (!term || !subject || !grade || !marksRecords) {
      return res.status(400).json({ message: 'Missing required parameters' });
    }

    if (isMockMode()) {
      const students = readMockStudents();

      marksRecords.forEach(rec => {
        const sIdx = students.findIndex(s => s._id === rec.studentId);
        if (sIdx === -1) return;

        const student = students[sIdx];
        if (!student.grades) student.grades = [];

        // Check if grade already exists for this term & subject
        const gIdx = student.grades.findIndex(g => g.term === term && g.subject === subject);
        const gradeLetter = calculateGradeLetter(rec.marks);

        const record = {
          term,
          subject,
          marks: Number(rec.marks),
          grade: gradeLetter
        };

        if (gIdx !== -1) {
          student.grades[gIdx] = record;
        } else {
          student.grades.push(record);
        }

        students[sIdx] = updateStudentPercentage(student);
      });

      writeMockStudents(students);
      return res.status(200).json({ message: 'Marks submitted and student percentages updated successfully (Local DB)' });
    }

    // MongoDB Mode
    for (const rec of marksRecords) {
      const student = await Student.findById(rec.studentId);
      if (!student) continue;

      if (!student.grades) student.grades = [];

      const gIdx = student.grades.findIndex(g => g.term === term && g.subject === subject);
      const gradeLetter = calculateGradeLetter(rec.marks);

      const record = {
        term,
        subject,
        marks: Number(rec.marks),
        grade: gradeLetter
      };

      if (gIdx !== -1) {
        student.grades[gIdx] = record;
      } else {
        student.grades.push(record);
      }

      await student.save(); // pre-save hook will recalculate overall percentage
    }

    res.status(200).json({ message: 'Marks recorded and academic profiles recalculated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting exam marks', error: error.message });
  }
};

import Student from '../models/Student.js';
import Teacher from '../models/Teacher.js';
import Class from '../models/Class.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_DATA_FILE = path.join(__dirname, '../data/students.json');

// Mock Database Helpers
const isMockMode = () => false;

const readMockData = () => {
  try {
    if (!fs.existsSync(MOCK_DATA_FILE)) {
      return [];
    }
    const data = fs.readFileSync(MOCK_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Failed to read local mock DB:', err);
    return [];
  }
};

const writeMockData = (data) => {
  try {
    const dir = path.dirname(MOCK_DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write local mock DB:', err);
  }
};

// Calculate calculated properties for a student record (mimics mongoose pre-save hooks)
const processStudentData = (student) => {
  // Attendance
  if (student.attendance) {
    const total = Number(student.attendance.totalDays) || 0;
    const present = Number(student.attendance.presentDays) || 0;
    student.attendance.rate = total > 0 ? Math.round((present / total) * 100) : 0;
  }

  // Percentage (marks-based)
  if (student.grades && student.grades.length > 0) {
    let sum = 0;
    student.grades.forEach(g => {
      sum += Number(g.marks) || 0;
    });
    student.percentage = Math.round((sum / student.grades.length) * 100) / 100;
  } else if (!student.percentage) {
    student.percentage = 0.0;
  }

  // Financial Dues
  if (student.finance) {
    const total = Number(student.finance.totalFees) || 0;
    const paid = Number(student.finance.feesPaid) || 0;
    student.finance.outstandingBalance = total - paid;
  }

  return student;
};

// Get all students with search & filter parameters
export const getAllStudents = async (req, res) => {
  try {
    const { search, grade, section, status } = req.query;

    if (isMockMode()) {
      let students = readMockData();

      // Text Search
      if (search) {
        const query = search.toLowerCase();
        students = students.filter(s => 
          s.name.toLowerCase().includes(query) ||
          s.rollNumber.toLowerCase().includes(query) ||
          s.registerNumber.toLowerCase().includes(query) ||
          s.email.toLowerCase().includes(query)
        );
      }

      // Dropdown filters
      if (grade && grade !== 'All') {
        students = students.filter(s => s.grade === grade);
      }
      if (section && section !== 'All') {
        students = students.filter(s => s.section === section.toUpperCase());
      }
      if (status && status !== 'All') {
        students = students.filter(s => s.status === status);
      }

      // Sort by Name
      students.sort((a, b) => a.name.localeCompare(b.name));
      return res.status(200).json(students);
    }

    // MongoDB Mode
    let query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { registerNumber: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (grade && grade !== 'All') query.grade = grade;
    if (section && section !== 'All') query.section = section.toUpperCase();
    if (status && status !== 'All') query.status = status;

    const students = await Student.find(query).sort({ name: 1 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving students', error: error.message });
  }
};

// Get single student by ID
export const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      const students = readMockData();
      const student = students.find(s => s._id === id);
      if (!student) {
        return res.status(404).json({ message: 'Student profile not found in local DB' });
      }

      const parentsFile = path.join(__dirname, '../data/parents.json');
      let parentObj = null;
      if (fs.existsSync(parentsFile) && student.parent) {
        try {
          const parents = JSON.parse(fs.readFileSync(parentsFile, 'utf-8'));
          parentObj = parents.find(p => p._id === student.parent) || null;
        } catch (e) {}
      }
      student.parent = parentObj;

      return res.status(200).json(student);
    }

    // MongoDB Mode
    const student = await Student.findById(id).populate('parent');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving student details', error: error.message });
  }
};

// Create a new student profile
export const createStudent = async (req, res) => {
  try {
    const studentData = req.body;
    const email = studentData.email?.toLowerCase().trim();
    const roll = studentData.rollNumber?.toUpperCase().trim();
    const reg = studentData.registerNumber?.toUpperCase().trim();

    if (isMockMode()) {
      const students = readMockData();

      // Check duplicates
      const emailExists = students.some(s => s.email.toLowerCase() === email);
      if (emailExists) return res.status(400).json({ message: 'Email address already exists in local DB' });

      const rollExists = students.some(s => s.rollNumber.toUpperCase() === roll);
      if (rollExists) return res.status(400).json({ message: 'Roll Number already exists in local DB' });

      const regExists = students.some(s => s.registerNumber.toUpperCase() === reg);
      if (regExists) return res.status(400).json({ message: 'Register Number already exists in local DB' });

      // Build student object
      const newStudent = {
        _id: new Date().getTime().toString(16) + Math.random().toString(16).slice(2, 8),
        ...studentData,
        email,
        rollNumber: roll,
        registerNumber: reg,
        grades: studentData.grades || [],
        attendance: studentData.attendance || { presentDays: 0, totalDays: 0, rate: 0 },
        finance: studentData.finance || { totalFees: 0, feesPaid: 0, outstandingBalance: 0, paymentHistory: [] },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Inject history if initial feesPaid > 0
      if (newStudent.finance.feesPaid > 0 && (!newStudent.finance.paymentHistory || newStudent.finance.paymentHistory.length === 0)) {
        newStudent.finance.paymentHistory = [{
          amount: newStudent.finance.feesPaid,
          date: new Date().toISOString(),
          paymentMethod: 'Bank Transfer',
          status: 'Paid'
        }];
      }

      const processed = processStudentData(newStudent);
      students.push(processed);
      writeMockData(students);

      return res.status(201).json({ message: 'Student created successfully (Local DB)', student: processed });
    }

    // MongoDB Mode
    const emailExists = await Student.findOne({ email });
    if (emailExists) return res.status(400).json({ message: 'Email address already exists' });

    const rollExists = await Student.findOne({ rollNumber: roll });
    if (rollExists) return res.status(400).json({ message: 'Roll Number already exists' });

    const regExists = await Student.findOne({ registerNumber: reg });
    if (regExists) return res.status(400).json({ message: 'Register Number already exists' });

    if (studentData.finance?.feesPaid > 0 && (!studentData.finance.paymentHistory || studentData.finance.paymentHistory.length === 0)) {
      studentData.finance.paymentHistory = [{
        amount: studentData.finance.feesPaid,
        date: new Date(),
        paymentMethod: 'Bank Transfer',
        status: 'Paid'
      }];
    }

    const newStudent = new Student(studentData);
    await newStudent.save();
    res.status(201).json({ message: 'Student created successfully', student: newStudent });
  } catch (error) {
    res.status(400).json({ message: 'Error creating student', error: error.message });
  }
};

// Update an existing student profile
export const updateStudent = async (req, res) => {
  try {
    const studentId = req.params.id;
    const updateData = req.body;
    const email = updateData.email?.toLowerCase().trim();
    const roll = updateData.rollNumber?.toUpperCase().trim();
    const reg = updateData.registerNumber?.toUpperCase().trim();

    if (isMockMode()) {
      const students = readMockData();
      const studentIdx = students.findIndex(s => s._id === studentId);
      
      if (studentIdx === -1) {
        return res.status(404).json({ message: 'Student profile not found in local DB' });
      }

      // Check duplicates
      if (email) {
        const emailExists = students.some(s => s._id !== studentId && s.email.toLowerCase() === email);
        if (emailExists) return res.status(400).json({ message: 'Email address already in use' });
      }
      if (roll) {
        const rollExists = students.some(s => s._id !== studentId && s.rollNumber.toUpperCase() === roll);
        if (rollExists) return res.status(400).json({ message: 'Roll Number already in use' });
      }
      if (reg) {
        const regExists = students.some(s => s._id !== studentId && s.registerNumber.toUpperCase() === reg);
        if (regExists) return res.status(400).json({ message: 'Register Number already in use' });
      }

      const updated = {
        ...students[studentIdx],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      if (email) updated.email = email;
      if (roll) updated.rollNumber = roll;
      if (reg) updated.registerNumber = reg;

      const processed = processStudentData(updated);
      students[studentIdx] = processed;
      writeMockData(students);

      return res.status(200).json({ message: 'Student details updated successfully (Local DB)', student: processed });
    }

    // MongoDB Mode
    if (email) {
      const emailExists = await Student.findOne({ email, _id: { $ne: studentId } });
      if (emailExists) return res.status(400).json({ message: 'Email address already in use by another student' });
    }
    if (roll) {
      const rollExists = await Student.findOne({ rollNumber: roll, _id: { $ne: studentId } });
      if (rollExists) return res.status(400).json({ message: 'Roll Number already in use by another student' });
    }
    if (reg) {
      const regExists = await Student.findOne({ registerNumber: reg, _id: { $ne: studentId } });
      if (regExists) return res.status(400).json({ message: 'Register Number already in use by another student' });
    }

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    Object.assign(student, updateData);
    await student.save();
    res.status(200).json({ message: 'Student details updated successfully', student });
  } catch (error) {
    res.status(400).json({ message: 'Error updating student details', error: error.message });
  }
};

// Delete a student profile
export const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      let students = readMockData();
      const exists = students.some(s => s._id === id);
      if (!exists) {
        return res.status(404).json({ message: 'Student profile not found in local DB' });
      }
      
      students = students.filter(s => s._id !== id);
      writeMockData(students);
      return res.status(200).json({ message: 'Student deleted successfully (Local DB)' });
    }

    // MongoDB Mode
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.status(200).json(student);
  } catch (error) {
    res.status(500).json({ message: 'Error deleting student profile', error: error.message });
  }
};

// Get analytical dashboard stats
export const getDashboardStats = async (req, res) => {
  try {
    if (isMockMode()) {
      const students = readMockData();
      const totalStudents = students.length;

      const teachersFile = path.join(__dirname, '../data/teachers.json');
      const classesFile = path.join(__dirname, '../data/classes.json');
      let totalTeachers = 0;
      let totalClasses = 0;
      
      if (fs.existsSync(teachersFile)) {
        try {
          totalTeachers = JSON.parse(fs.readFileSync(teachersFile, 'utf-8')).length;
        } catch (e) {}
      }
      if (fs.existsSync(classesFile)) {
        try {
          totalClasses = JSON.parse(fs.readFileSync(classesFile, 'utf-8')).length;
        } catch (e) {}
      }

      const pendingFeesCount = students.filter(s => s.finance && (s.finance.totalFees - s.finance.feesPaid) > 0).length;

      if (totalStudents === 0) {
        return res.status(200).json({
          totalStudents: 0,
          totalTeachers,
          totalClasses,
          pendingFeesCount,
          avgGpa: 0, // renamed key in response can still be avgGpa or we can keep avgGpa for API compatibility while loading percentage
          avgAttendance: 0,
          financials: { totalFees: 0, feesPaid: 0, outstandingFees: 0, collectionRate: 0 },
          departmentDistribution: [],
          statusDistribution: { Active: 0, Suspended: 0, Graduated: 0, Inactive: 0 },
          recentActivities: []
        });
      }

      let pctSum = 0;
      let attendanceSum = 0;
      let feeTotal = 0;
      let feePaidTotal = 0;
      let feeOutstandingTotal = 0;
      
      const gradeCounts = {};
      const statusCounts = { Active: 0, Suspended: 0, Graduated: 0, Inactive: 0 };

      students.forEach(s => {
        pctSum += Number(s.percentage) || 0;
        attendanceSum += Number(s.attendance?.rate) || 0;
        feeTotal += Number(s.finance?.totalFees) || 0;
        feePaidTotal += Number(s.finance?.feesPaid) || 0;
        feeOutstandingTotal += Number(s.finance?.outstandingBalance) || 0;

        // Grade / Class
        gradeCounts[s.grade] = (gradeCounts[s.grade] || 0) + 1;
        // Status
        if (s.status in statusCounts) {
          statusCounts[s.status]++;
        }
      });

      const avgGpa = Math.round((pctSum / totalStudents) * 100) / 100; // mapped to avgGpa response field for frontend ease
      const avgAttendance = Math.round((attendanceSum / totalStudents) * 10) / 10;
      const collectionRate = feeTotal > 0 ? Math.round((feePaidTotal / feeTotal) * 100) : 0;

      // Grade distributions formatting
      const departmentDistribution = Object.keys(gradeCounts).map(name => ({
        name,
        count: gradeCounts[name]
      })).sort((a, b) => {
        // Sort grade logically if possible, e.g. Grade 1 before Grade 10, or alphabetically
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });

      const recentStudents = [...students]
        .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        .slice(0, 5);

      const recentActivities = recentStudents.map(s => {
        const timeDiff = Math.abs(new Date() - new Date(s.updatedAt));
        let timeStr = 'Just now';
        const mins = Math.floor(timeDiff / (1000 * 60));
        const hours = Math.floor(timeDiff / (1000 * 60 * 60));
        if (hours > 0) {
          timeStr = `${hours}h ago`;
        } else if (mins > 0) {
          timeStr = `${mins}m ago`;
        }

        return {
          id: s._id,
          text: `Student ${s.name} (${s.rollNumber}) details updated.`,
          type: s.status === 'Active' ? 'success' : 'info',
          time: timeStr
        };
      });

      return res.status(200).json({
        totalStudents,
        totalTeachers,
        totalClasses,
        pendingFeesCount,
        avgGpa, // holds average percentage (0-100)
        avgAttendance,
        financials: {
          totalFees: feeTotal,
          feesPaid: feePaidTotal,
          outstandingFees: feeOutstandingTotal,
          collectionRate
        },
        departmentDistribution, // holds grade distribution
        statusDistribution: statusCounts,
        recentActivities
      });
    }

    // MongoDB Mode
    const totalStudents = await Student.countDocuments();
    const totalTeachers = await Teacher.countDocuments();
    const totalClasses = await Class.countDocuments();
    const pendingFeesCount = await Student.countDocuments({ 'finance.outstandingBalance': { $gt: 0 } });
    
    const stats = await Student.aggregate([
      {
        $group: {
          _id: null,
          avgGpa: { $avg: '$percentage' }, // holds average percentage
          avgAttendance: { $avg: '$attendance.rate' },
          totalFees: { $sum: '$finance.totalFees' },
          feesPaid: { $sum: '$finance.feesPaid' },
          outstandingFees: { $sum: '$finance.outstandingBalance' }
        }
      }
    ]);

    const result = stats[0] || {
      avgGpa: 0,
      avgAttendance: 0,
      totalFees: 0,
      feesPaid: 0,
      outstandingFees: 0
    };

    const gradeStats = await Student.aggregate([
      { $group: { _id: '$grade', count: { $sum: 1 } } }
    ]);

    const departmentDistribution = gradeStats.map(dept => ({
      name: dept._id,
      count: dept.count
    })).sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    const statusStats = await Student.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const statusDistribution = statusStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, { Active: 0, Suspended: 0, Graduated: 0, Inactive: 0 });

    const recentStudents = await Student.find()
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('name rollNumber grade updatedAt status');

    const recentActivities = recentStudents.map(s => {
      const timeDiff = Math.abs(new Date() - s.updatedAt);
      let timeStr = 'Just now';
      const mins = Math.floor(timeDiff / (1000 * 60));
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      if (hours > 0) {
        timeStr = `${hours}h ago`;
      } else if (mins > 0) {
        timeStr = `${mins}m ago`;
      }

      return {
        id: s._id,
        text: `Student ${s.name} (${s.rollNumber}) details updated.`,
        type: s.status === 'Active' ? 'success' : 'info',
        time: timeStr
      };
    });

    res.status(200).json({
      totalStudents,
      totalTeachers,
      totalClasses,
      pendingFeesCount,
      avgGpa: Math.round(result.avgGpa * 100) / 100, // holds average percentage
      avgAttendance: Math.round(result.avgAttendance * 10) / 10,
      financials: {
        totalFees: result.totalFees,
        feesPaid: result.feesPaid,
        outstandingFees: result.outstandingFees,
        collectionRate: result.totalFees > 0 ? Math.round((result.feesPaid / result.totalFees) * 100) : 0
      },
      departmentDistribution, // holds grade distribution
      statusDistribution,
      recentActivities
    });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard stats', error: error.message });
  }
};

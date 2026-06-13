import Teacher from '../models/Teacher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_TEACHERS_FILE = path.join(__dirname, '../data/teachers.json');

const isMockMode = () => false;

const readMockTeachers = () => {
  try {
    if (!fs.existsSync(MOCK_TEACHERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_TEACHERS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockTeachers = (data) => {
  try {
    fs.writeFileSync(MOCK_TEACHERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
};

export const getTeachers = async (req, res) => {
  try {
    if (isMockMode()) {
      const teachers = readMockTeachers();
      return res.status(200).json(teachers);
    }
    const teachers = await Teacher.find().sort({ name: 1 });
    res.status(200).json(teachers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching teachers', error: error.message });
  }
};

export const createTeacher = async (req, res) => {
  try {
    const { name, email, phone, subject, assignedClasses } = req.body;
    if (!name || !email || !phone || !subject) {
      return res.status(400).json({ message: 'All basic fields are required' });
    }

    if (isMockMode()) {
      const teachers = readMockTeachers();
      if (teachers.some(t => t.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ message: 'Teacher email already registered' });
      }
      const newTeacher = {
        _id: new Date().getTime().toString(16),
        name,
        email: email.toLowerCase(),
        phone,
        subject,
        assignedClasses: assignedClasses || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      teachers.push(newTeacher);
      writeMockTeachers(teachers);
      return res.status(201).json(newTeacher);
    }

    const exists = await Teacher.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Teacher email already registered' });

    const newTeacher = new Teacher({ name, email, phone, subject, assignedClasses });
    await newTeacher.save();
    res.status(201).json(newTeacher);
  } catch (error) {
    res.status(400).json({ message: 'Error creating teacher', error: error.message });
  }
};

export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, subject, assignedClasses } = req.body;

    if (isMockMode()) {
      const teachers = readMockTeachers();
      const idx = teachers.findIndex(t => t._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Teacher not found' });

      if (email && email.toLowerCase() !== teachers[idx].email.toLowerCase()) {
        if (teachers.some(t => t._id !== id && t.email.toLowerCase() === email.toLowerCase())) {
          return res.status(400).json({ message: 'Email address already in use' });
        }
      }

      teachers[idx] = {
        ...teachers[idx],
        name: name || teachers[idx].name,
        email: email ? email.toLowerCase() : teachers[idx].email,
        phone: phone || teachers[idx].phone,
        subject: subject || teachers[idx].subject,
        assignedClasses: assignedClasses !== undefined ? assignedClasses : teachers[idx].assignedClasses,
        updatedAt: new Date().toISOString()
      };

      writeMockTeachers(teachers);
      return res.status(200).json(teachers[idx]);
    }

    const teacher = await Teacher.findById(id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

    if (email && email.toLowerCase() !== teacher.email.toLowerCase()) {
      const emailExists = await Teacher.findOne({ email: email.toLowerCase(), _id: { $ne: id } });
      if (emailExists) return res.status(400).json({ message: 'Email address already in use' });
    }

    Object.assign(teacher, { name, email, phone, subject, assignedClasses });
    await teacher.save();
    res.status(200).json(teacher);
  } catch (error) {
    res.status(400).json({ message: 'Error updating teacher', error: error.message });
  }
};

export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      let teachers = readMockTeachers();
      if (!teachers.some(t => t._id === id)) return res.status(404).json({ message: 'Teacher not found' });
      teachers = teachers.filter(t => t._id !== id);
      writeMockTeachers(teachers);
      return res.status(200).json({ message: 'Teacher deleted successfully' });
    }
    const teacher = await Teacher.findByIdAndDelete(id);
    if (!teacher) return res.status(404).json({ message: 'Teacher not found' });
    res.status(200).json({ message: 'Teacher deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting teacher', error: error.message });
  }
};

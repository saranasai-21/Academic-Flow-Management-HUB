import Parent from '../models/Parent.js';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_PARENTS_FILE = path.join(__dirname, '../data/parents.json');
const MOCK_STUDENTS_FILE = path.join(__dirname, '../data/students.json');

const isMockMode = () => false;

const readMockParents = () => {
  try {
    if (!fs.existsSync(MOCK_PARENTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_PARENTS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockParents = (data) => {
  try {
    fs.writeFileSync(MOCK_PARENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
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

export const getParents = async (req, res) => {
  try {
    if (isMockMode()) {
      const parents = readMockParents();
      return res.status(200).json(parents);
    }
    const parents = await Parent.find().populate('linkedStudents', 'name rollNumber grade section').sort({ fatherName: 1 });
    res.status(200).json(parents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching parents', error: error.message });
  }
};

export const createParent = async (req, res) => {
  try {
    const { fatherName, motherName, phone, email, occupation, emergencyContact } = req.body;
    if (!fatherName || !motherName || !phone || !emergencyContact) {
      return res.status(400).json({ message: 'Father, mother, phone and emergency contact names are required' });
    }

    if (isMockMode()) {
      const parents = readMockParents();
      const newParent = {
        _id: new Date().getTime().toString(16),
        fatherName,
        motherName,
        phone,
        email: email || '',
        occupation: occupation || '',
        emergencyContact,
        linkedStudents: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      parents.push(newParent);
      writeMockParents(parents);
      return res.status(201).json(newParent);
    }

    const newParent = new Parent({ fatherName, motherName, phone, email, occupation, emergencyContact });
    await newParent.save();
    res.status(201).json(newParent);
  } catch (error) {
    res.status(400).json({ message: 'Error creating parent record', error: error.message });
  }
};

export const updateParent = async (req, res) => {
  try {
    const { id } = req.params;
    const { fatherName, motherName, phone, email, occupation, emergencyContact } = req.body;

    if (isMockMode()) {
      const parents = readMockParents();
      const idx = parents.findIndex(p => p._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Parent record not found' });

      parents[idx] = {
        ...parents[idx],
        fatherName: fatherName || parents[idx].fatherName,
        motherName: motherName || parents[idx].motherName,
        phone: phone || parents[idx].phone,
        email: email !== undefined ? email : parents[idx].email,
        occupation: occupation !== undefined ? occupation : parents[idx].occupation,
        emergencyContact: emergencyContact || parents[idx].emergencyContact,
        updatedAt: new Date().toISOString()
      };

      writeMockParents(parents);
      return res.status(200).json(parents[idx]);
    }

    const parent = await Parent.findById(id);
    if (!parent) return res.status(404).json({ message: 'Parent record not found' });

    Object.assign(parent, { fatherName, motherName, phone, email, occupation, emergencyContact });
    await parent.save();
    res.status(200).json(parent);
  } catch (error) {
    res.status(400).json({ message: 'Error updating parent record', error: error.message });
  }
};

export const deleteParent = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      let parents = readMockParents();
      if (!parents.some(p => p._id === id)) return res.status(404).json({ message: 'Parent record not found' });
      
      // Unlink in student records
      const students = readMockStudents();
      students.forEach(s => {
        if (s.parent === id) {
          delete s.parent;
        }
      });
      writeMockStudents(students);

      parents = parents.filter(p => p._id !== id);
      writeMockParents(parents);
      return res.status(200).json({ message: 'Parent deleted successfully' });
    }

    // MongoDB Mode
    const parent = await Parent.findById(id);
    if (!parent) return res.status(404).json({ message: 'Parent record not found' });

    // Unlink students
    await Student.updateMany({ parent: id }, { $unset: { parent: 1 } });
    await Parent.findByIdAndDelete(id);

    res.status(200).json({ message: 'Parent deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting parent record', error: error.message });
  }
};

export const linkStudentToParent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    if (!parentId || !studentId) {
      return res.status(400).json({ message: 'Parent ID and Student ID are required' });
    }

    if (isMockMode()) {
      const parents = readMockParents();
      const students = readMockStudents();

      const pIdx = parents.findIndex(p => p._id === parentId);
      const sIdx = students.findIndex(s => s._id === studentId);

      if (pIdx === -1) return res.status(404).json({ message: 'Parent record not found' });
      if (sIdx === -1) return res.status(404).json({ message: 'Student profile not found' });

      // Link Student to Parent
      if (!parents[pIdx].linkedStudents.includes(studentId)) {
        parents[pIdx].linkedStudents.push(studentId);
      }
      // Link Parent to Student
      students[sIdx].parent = parentId;

      writeMockParents(parents);
      writeMockStudents(students);
      return res.status(200).json({ message: 'Student linked to parent successfully (Local DB)' });
    }

    // MongoDB Mode
    const parent = await Parent.findById(parentId);
    const student = await Student.findById(studentId);

    if (!parent) return res.status(404).json({ message: 'Parent record not found' });
    if (!student) return res.status(404).json({ message: 'Student not found' });

    if (!parent.linkedStudents.includes(studentId)) {
      parent.linkedStudents.push(studentId);
      await parent.save();
    }

    student.parent = parentId;
    await student.save();

    res.status(200).json({ message: 'Student linked to parent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error linking student to parent', error: error.message });
  }
};

export const unlinkStudentFromParent = async (req, res) => {
  try {
    const { parentId, studentId } = req.body;
    if (!parentId || !studentId) {
      return res.status(400).json({ message: 'Parent ID and Student ID are required' });
    }

    if (isMockMode()) {
      const parents = readMockParents();
      const students = readMockStudents();

      const pIdx = parents.findIndex(p => p._id === parentId);
      const sIdx = students.findIndex(s => s._id === studentId);

      if (pIdx !== -1) {
        parents[pIdx].linkedStudents = parents[pIdx].linkedStudents.filter(id => id !== studentId);
      }
      if (sIdx !== -1 && students[sIdx].parent === parentId) {
        delete students[sIdx].parent;
      }

      writeMockParents(parents);
      writeMockStudents(students);
      return res.status(200).json({ message: 'Student unlinked successfully (Local DB)' });
    }

    // MongoDB Mode
    await Parent.findByIdAndUpdate(parentId, { $pull: { linkedStudents: studentId } });
    await Student.findByIdAndUpdate(studentId, { $unset: { parent: 1 } });

    res.status(200).json({ message: 'Student unlinked successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error unlinking student', error: error.message });
  }
};

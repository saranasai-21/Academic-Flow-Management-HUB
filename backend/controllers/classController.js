import Class from '../models/Class.js';
import Student from '../models/Student.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_CLASSES_FILE = path.join(__dirname, '../data/classes.json');
const MOCK_STUDENTS_FILE = path.join(__dirname, '../data/students.json');

const isMockMode = () => false;

const readMockClasses = () => {
  try {
    if (!fs.existsSync(MOCK_CLASSES_FILE)) {
      return [];
    }
    const data = fs.readFileSync(MOCK_CLASSES_FILE, 'utf-8');
    return JSON.parse(data).map(normalizeClassRecord);
  } catch (err) {
    console.error('Failed to read classes mock DB:', err);
    return [];
  }
};

const writeMockClasses = (data) => {
  try {
    const dir = path.dirname(MOCK_CLASSES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(MOCK_CLASSES_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write classes mock DB:', err);
  }
};

const DEFAULT_GRADES = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10',
  'Grade 11', 'Grade 12'
];

const normalizeSections = (sections) => {
  if (Array.isArray(sections)) {
    return sections
      .map(section => String(section).trim().toUpperCase())
      .filter(Boolean);
  }

  if (typeof sections === 'string') {
    return sections
      .split(',')
      .map(section => section.trim().toUpperCase())
      .filter(Boolean);
  }

  return ['A'];
};

const normalizeSubjects = (subjects) => {
  if (Array.isArray(subjects)) {
    return subjects.map(subject => String(subject).trim()).filter(Boolean);
  }

  if (typeof subjects === 'string') {
    return subjects.split(',').map(subject => subject.trim()).filter(Boolean);
  }

  return [];
};

const normalizeClassRecord = (classRecord) => ({
  ...classRecord,
  sections: classRecord.sections?.length ? normalizeSections(classRecord.sections) : ['A', 'B', 'C', 'D'],
  subjects: classRecord.subjects?.length ? normalizeSubjects(classRecord.subjects) : [],
  feeAmount: Number(classRecord.feeAmount) || 0
});

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
    console.error('Failed to write students mock DB:', err);
  }
};

// Get all classes
export const getClasses = async (req, res) => {
  try {
    if (isMockMode()) {
      const classes = readMockClasses();
      return res.status(200).json(classes);
    }

    // MongoDB Mode
    const classes = await Class.find().sort({ name: 1 });
    res.status(200).json(classes);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching classes', error: error.message });
  }
};

// Create a new custom class
export const createClass = async (req, res) => {
  try {
    const { name, description, sections, subjects, feeAmount } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Class name is required' });
    }

    const trimmedName = name.trim();
    const normalizedSections = normalizeSections(sections);
    const normalizedSubjects = normalizeSubjects(subjects);
    const normalizedFee = Number(feeAmount) || 0;

    if (isMockMode()) {
      const classes = readMockClasses();
      const exists = classes.some(c => c.name.toLowerCase() === trimmedName.toLowerCase());
      if (exists) {
        return res.status(400).json({ message: `Class "${trimmedName}" already exists` });
      }

      const newClass = {
        _id: new Date().getTime().toString(16),
        name: trimmedName,
        description: description || '',
        sections: normalizedSections,
        subjects: normalizedSubjects,
        feeAmount: normalizedFee,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      classes.push(newClass);
      writeMockClasses(classes);
      return res.status(201).json({ message: 'Class created successfully (Local DB)', class: newClass });
    }

    // MongoDB Mode
    const exists = await Class.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    if (exists) {
      return res.status(400).json({ message: `Class "${trimmedName}" already exists` });
    }

    const newClass = new Class({
      name: trimmedName,
      description,
      sections: normalizedSections,
      subjects: normalizedSubjects,
      feeAmount: normalizedFee
    });
    await newClass.save();
    res.status(201).json({ message: 'Class created successfully', class: newClass });
  } catch (error) {
    res.status(400).json({ message: 'Error creating class', error: error.message });
  }
};

// Update class configuration, sections, subjects and fee structure
export const updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, sections, subjects, feeAmount } = req.body;

    if (isMockMode()) {
      const classes = readMockClasses();
      const idx = classes.findIndex(c => c._id === id);
      if (idx === -1) {
        return res.status(404).json({ message: 'Class not found in local DB' });
      }

      const nextName = name ? name.trim() : classes[idx].name;
      const duplicate = classes.some(c => c._id !== id && c.name.toLowerCase() === nextName.toLowerCase());
      if (duplicate) {
        return res.status(400).json({ message: `Class "${nextName}" already exists` });
      }

      classes[idx] = {
        ...classes[idx],
        name: nextName,
        description: description !== undefined ? description : classes[idx].description,
        sections: sections !== undefined ? normalizeSections(sections) : (classes[idx].sections || ['A']),
        subjects: subjects !== undefined ? normalizeSubjects(subjects) : (classes[idx].subjects || []),
        feeAmount: feeAmount !== undefined ? Number(feeAmount) || 0 : (classes[idx].feeAmount || 0),
        updatedAt: new Date().toISOString()
      };

      writeMockClasses(classes);
      return res.status(200).json({ message: 'Class updated successfully (Local DB)', class: classes[idx] });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description;
    if (sections !== undefined) updateData.sections = normalizeSections(sections);
    if (subjects !== undefined) updateData.subjects = normalizeSubjects(subjects);
    if (feeAmount !== undefined) updateData.feeAmount = Number(feeAmount) || 0;

    if (updateData.name) {
      const exists = await Class.findOne({ name: { $regex: `^${updateData.name}$`, $options: 'i' }, _id: { $ne: id } });
      if (exists) {
        return res.status(400).json({ message: `Class "${updateData.name}" already exists` });
      }
    }

    const updated = await Class.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
    if (!updated) {
      return res.status(404).json({ message: 'Class not found' });
    }

    res.status(200).json({ message: 'Class updated successfully', class: updated });
  } catch (error) {
    res.status(400).json({ message: 'Error updating class', error: error.message });
  }
};

// Apply a class fee structure to all students registered in that class
export const applyClassFeeToStudents = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      const classes = readMockClasses();
      const selectedClass = classes.find(c => c._id === id);
      if (!selectedClass) {
        return res.status(404).json({ message: 'Class not found in local DB' });
      }

      const feeAmount = Number(selectedClass.feeAmount) || 0;
      const students = readMockStudents();
      let updatedCount = 0;

      const updatedStudents = students.map(student => {
        if (student.grade !== selectedClass.name) return student;

        const paid = Number(student.finance?.feesPaid) || 0;
        updatedCount += 1;
        return {
          ...student,
          finance: {
            ...(student.finance || {}),
            totalFees: feeAmount,
            feesPaid: paid,
            outstandingBalance: Math.max(feeAmount - paid, 0),
            paymentHistory: student.finance?.paymentHistory || []
          },
          updatedAt: new Date().toISOString()
        };
      });

      writeMockStudents(updatedStudents);
      return res.status(200).json({ message: `Fee structure applied to ${updatedCount} students (Local DB)`, updatedCount });
    }

    const selectedClass = await Class.findById(id);
    if (!selectedClass) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const students = await Student.find({ grade: selectedClass.name });
    for (const student of students) {
      const paid = Number(student.finance?.feesPaid) || 0;
      student.finance = {
        ...(student.finance?.toObject?.() || student.finance || {}),
        totalFees: selectedClass.feeAmount || 0,
        feesPaid: paid,
        outstandingBalance: Math.max((selectedClass.feeAmount || 0) - paid, 0),
        paymentHistory: student.finance?.paymentHistory || []
      };
      await student.save();
    }

    res.status(200).json({ message: `Fee structure applied to ${students.length} students`, updatedCount: students.length });
  } catch (error) {
    res.status(500).json({ message: 'Error applying fee structure', error: error.message });
  }
};

// Seed default K-12 grades
export const seedDefaultClasses = async (req, res) => {
  try {
    if (isMockMode()) {
      const classes = DEFAULT_GRADES.map((g, idx) => ({
        _id: `class-${idx+1}`,
        name: g,
        description: `Standard academic ${g} curriculum.`,
        sections: ['A', 'B', 'C', 'D'],
        subjects: [],
        feeAmount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }));
      writeMockClasses(classes);
      return res.status(200).json({ message: 'Default K-12 classes seeded successfully (Local DB)', classes });
    }

    // MongoDB Mode
    await Class.deleteMany({});
    const seedData = DEFAULT_GRADES.map(g => ({
      name: g,
      description: `Standard academic ${g} curriculum.`,
      sections: ['A', 'B', 'C', 'D'],
      subjects: [],
      feeAmount: 0
    }));
    await Class.insertMany(seedData);
    const classes = await Class.find().sort({ name: 1 });
    res.status(200).json({ message: 'Default K-12 classes seeded successfully', classes });
  } catch (error) {
    res.status(500).json({ message: 'Error seeding default classes', error: error.message });
  }
};

// Delete a class
export const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    if (isMockMode()) {
      let classes = readMockClasses();
      const exists = classes.some(c => c._id === id);
      if (!exists) {
        return res.status(404).json({ message: 'Class not found in local DB' });
      }

      classes = classes.filter(c => c._id !== id);
      writeMockClasses(classes);
      return res.status(200).json({ message: 'Class deleted successfully (Local DB)' });
    }

    // MongoDB Mode
    const deleted = await Class.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Class not found' });
    }
    res.status(200).json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting class', error: error.message });
  }
};

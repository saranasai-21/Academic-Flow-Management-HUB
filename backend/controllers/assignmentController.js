import Assignment from '../models/Assignment.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_ASSIGNMENTS_FILE = path.join(__dirname, '../data/assignments.json');
const isMockMode = () => false;

const readMockAssignments = () => {
  try {
    if (!fs.existsSync(MOCK_ASSIGNMENTS_FILE)) {
      fs.writeFileSync(MOCK_ASSIGNMENTS_FILE, '[]', 'utf-8');
    }
    return JSON.parse(fs.readFileSync(MOCK_ASSIGNMENTS_FILE, 'utf-8'));
  } catch {
    return [];
  }
};

const writeMockAssignments = (data) => {
  fs.writeFileSync(MOCK_ASSIGNMENTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const applyFilters = (items, query) => {
  const { subject, status, teacher, grade, section } = query;
  return items.filter(item =>
    (!subject || subject === 'All' || item.subject === subject) &&
    (!status || status === 'All' || item.status === status) &&
    (!teacher || teacher === 'All' || item.teacher === teacher) &&
    (!grade || item.grade === grade) &&
    (!section || item.section === section)
  );
};

export const getAssignments = async (req, res) => {
  try {
    if (isMockMode()) {
      return res.status(200).json(applyFilters(readMockAssignments(), req.query));
    }

    const query = {};
    ['subject', 'status', 'teacher', 'grade', 'section'].forEach(key => {
      if (req.query[key] && req.query[key] !== 'All') query[key] = req.query[key];
    });
    const assignments = await Assignment.find(query).sort({ due: 1 });
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching assignments', error: error.message });
  }
};

export const createAssignment = async (req, res) => {
  try {
    if (isMockMode()) {
      const assignments = readMockAssignments();
      const assignment = {
        _id: new Date().getTime().toString(16),
        ...req.body,
        status: req.body.status || 'Pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      assignments.push(assignment);
      writeMockAssignments(assignments);
      return res.status(201).json(assignment);
    }

    const assignment = await Assignment.create(req.body);
    res.status(201).json(assignment);
  } catch (error) {
    res.status(400).json({ message: 'Error creating assignment', error: error.message });
  }
};

export const submitAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = {
      submittedFile: req.body.submittedFile || 'student-submission.pdf',
      answer: req.body.answer || '',
      notes: req.body.notes || '',
      status: req.body.status || 'Submitted',
      updatedAt: new Date().toISOString()
    };

    if (isMockMode()) {
      const assignments = readMockAssignments();
      const idx = assignments.findIndex(item => item._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Assignment not found' });
      assignments[idx] = { ...assignments[idx], ...payload };
      writeMockAssignments(assignments);
      return res.status(200).json(assignments[idx]);
    }

    const assignment = await Assignment.findByIdAndUpdate(id, payload, { new: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.status(200).json(assignment);
  } catch (error) {
    res.status(400).json({ message: 'Error submitting assignment', error: error.message });
  }
};

export const updateAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      const assignments = readMockAssignments();
      const idx = assignments.findIndex(item => item._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Assignment not found' });
      assignments[idx] = { ...assignments[idx], ...req.body, updatedAt: new Date().toISOString() };
      writeMockAssignments(assignments);
      return res.status(200).json(assignments[idx]);
    }

    const assignment = await Assignment.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.status(200).json(assignment);
  } catch (error) {
    res.status(400).json({ message: 'Error updating assignment', error: error.message });
  }
};

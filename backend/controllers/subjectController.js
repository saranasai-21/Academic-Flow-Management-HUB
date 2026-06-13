import Subject from '../models/Subject.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_SUBJECTS_FILE = path.join(__dirname, '../data/subjects.json');

const isMockMode = () => false;

const readMockSubjects = () => {
  try {
    if (!fs.existsSync(MOCK_SUBJECTS_FILE)) return [];
    return JSON.parse(fs.readFileSync(MOCK_SUBJECTS_FILE, 'utf-8'));
  } catch (err) {
    return [];
  }
};

const writeMockSubjects = (data) => {
  try {
    fs.writeFileSync(MOCK_SUBJECTS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {}
};

export const getSubjects = async (req, res) => {
  try {
    if (isMockMode()) {
      const subjects = readMockSubjects();
      return res.status(200).json(subjects);
    }
    const subjects = await Subject.find().sort({ name: 1 });
    res.status(200).json(subjects);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching subjects', error: error.message });
  }
};

export const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ message: 'Subject name and code are required' });
    }

    const upperCode = code.toUpperCase().trim();
    const trimmedName = name.trim();

    if (isMockMode()) {
      const subjects = readMockSubjects();
      if (subjects.some(s => s.code.toUpperCase() === upperCode)) {
        return res.status(400).json({ message: `Subject code "${upperCode}" already exists` });
      }
      if (subjects.some(s => s.name.toLowerCase() === trimmedName.toLowerCase())) {
        return res.status(400).json({ message: `Subject "${trimmedName}" already exists` });
      }

      const newSubject = {
        _id: new Date().getTime().toString(16),
        name: trimmedName,
        code: upperCode,
        description: description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      subjects.push(newSubject);
      writeMockSubjects(subjects);
      return res.status(201).json(newSubject);
    }

    // MongoDB Mode
    const codeExists = await Subject.findOne({ code: upperCode });
    if (codeExists) return res.status(400).json({ message: `Subject code "${upperCode}" already exists` });

    const nameExists = await Subject.findOne({ name: { $regex: `^${trimmedName}$`, $options: 'i' } });
    if (nameExists) return res.status(400).json({ message: `Subject "${trimmedName}" already exists` });

    const newSubject = new Subject({ name: trimmedName, code: upperCode, description });
    await newSubject.save();
    res.status(201).json(newSubject);
  } catch (error) {
    res.status(400).json({ message: 'Error creating subject', error: error.message });
  }
};

export const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const name = req.body.name?.trim();
    const code = req.body.code?.toUpperCase().trim();
    if (!name || !code) return res.status(400).json({ message: 'Subject name and code are required' });

    const duplicate = await Subject.findOne({
      _id: { $ne: id },
      $or: [{ code }, { name: { $regex: `^${name}$`, $options: 'i' } }]
    });
    if (duplicate) return res.status(400).json({ message: 'Subject name or code already exists' });

    const subject = await Subject.findByIdAndUpdate(id, { name, code, description: req.body.description || '' }, { new: true, runValidators: true });
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    res.json(subject);
  } catch (error) {
    res.status(400).json({ message: 'Error updating subject', error: error.message });
  }
};

export const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      let subjects = readMockSubjects();
      const exists = subjects.some(s => s._id === id);
      if (!exists) return res.status(404).json({ message: 'Subject not found' });
      subjects = subjects.filter(s => s._id !== id);
      writeMockSubjects(subjects);
      return res.status(200).json({ message: 'Subject deleted successfully' });
    }

    const deleted = await Subject.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Subject not found' });
    res.status(200).json({ message: 'Subject deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting subject', error: error.message });
  }
};

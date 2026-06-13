import StudyMaterial from '../models/StudyMaterial.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOCK_MATERIALS_FILE = path.join(__dirname, '../data/materials.json');
const isMockMode = () => false;

const defaultMaterials = [
  { _id: 'mat-1', title: 'Algebra Basics', subject: 'Maths', type: 'PDF', uploadedBy: 'Ravi Sir', grade: 'Grade 10', uploadDate: '2026-06-10T00:00:00.000Z', views: 120, downloads: 50, rating: 5, completed: true, url: 'algebra-basics.pdf', description: 'Core algebra revision notes.', bookmarked: true },
  { _id: 'mat-2', title: 'Photosynthesis Video Class', subject: 'Science', type: 'Video', uploadedBy: 'Kavitha Madam', grade: 'Grade 10', uploadDate: '2026-06-11T00:00:00.000Z', views: 210, downloads: 88, rating: 4, completed: true, url: 'photosynthesis-video.mp4', description: 'Recorded video lesson.', bookmarked: false },
  { _id: 'mat-3', title: 'English Grammar Basics', subject: 'English', type: 'Notes', uploadedBy: 'Anitha Madam', grade: 'Grade 10', uploadDate: '2026-06-12T00:00:00.000Z', views: 96, downloads: 41, rating: 5, completed: false, url: 'grammar-notes.pdf', description: 'Grammar practice notes.', bookmarked: true },
  { _id: 'mat-4', title: 'Olympiad Practice Pack', subject: 'Competitive Exam', type: 'PDF', uploadedBy: 'Academic Cell', grade: 'All', uploadDate: '2026-06-04T00:00:00.000Z', views: 300, downloads: 160, rating: 5, completed: false, url: 'olympiad-pack.pdf', description: 'Competitive exam resources.', bookmarked: true }
];

const readMockMaterials = () => {
  try {
    if (!fs.existsSync(MOCK_MATERIALS_FILE)) {
      fs.writeFileSync(MOCK_MATERIALS_FILE, JSON.stringify(defaultMaterials, null, 2), 'utf-8');
    }
    return JSON.parse(fs.readFileSync(MOCK_MATERIALS_FILE, 'utf-8'));
  } catch (err) {
    return defaultMaterials;
  }
};

const writeMockMaterials = (data) => {
  fs.writeFileSync(MOCK_MATERIALS_FILE, JSON.stringify(data, null, 2), 'utf-8');
};

const filterMaterials = (items, query) => items.filter(item =>
  (!query.subject || query.subject === 'All' || item.subject === query.subject) &&
  (!query.type || query.type === 'All' || item.type === query.type) &&
  (!query.uploadedBy || query.uploadedBy === 'All' || item.uploadedBy === query.uploadedBy) &&
  (!query.grade || item.grade === query.grade || item.grade === 'All')
);

export const getMaterials = async (req, res) => {
  try {
    if (isMockMode()) {
      return res.status(200).json(filterMaterials(readMockMaterials(), req.query));
    }

    const query = {};
    ['subject', 'type', 'uploadedBy', 'grade'].forEach(key => {
      if (req.query[key] && req.query[key] !== 'All') query[key] = req.query[key];
    });
    const materials = await StudyMaterial.find(query).sort({ uploadDate: -1 });
    res.status(200).json(materials);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching study materials', error: error.message });
  }
};

export const createMaterial = async (req, res) => {
  try {
    if (isMockMode()) {
      const materials = readMockMaterials();
      const material = {
        _id: new Date().getTime().toString(16),
        ...req.body,
        uploadDate: req.body.uploadDate || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      materials.push(material);
      writeMockMaterials(materials);
      return res.status(201).json(material);
    }

    const material = await StudyMaterial.create(req.body);
    res.status(201).json(material);
  } catch (error) {
    res.status(400).json({ message: 'Error creating study material', error: error.message });
  }
};

export const updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    if (isMockMode()) {
      const materials = readMockMaterials();
      const idx = materials.findIndex(item => item._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Material not found' });
      materials[idx] = { ...materials[idx], ...req.body, updatedAt: new Date().toISOString() };
      writeMockMaterials(materials);
      return res.status(200).json(materials[idx]);
    }

    const material = await StudyMaterial.findByIdAndUpdate(id, req.body, { new: true });
    if (!material) return res.status(404).json({ message: 'Material not found' });
    res.status(200).json(material);
  } catch (error) {
    res.status(400).json({ message: 'Error updating study material', error: error.message });
  }
};

export const recordMaterialActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    if (!['view', 'download', 'complete', 'bookmark'].includes(action)) {
      return res.status(400).json({ message: 'Unsupported material action' });
    }

    if (isMockMode()) {
      const materials = readMockMaterials();
      const idx = materials.findIndex(item => item._id === id);
      if (idx === -1) return res.status(404).json({ message: 'Material not found' });
      const material = materials[idx];
      if (action === 'view') material.views = Number(material.views || 0) + 1;
      if (action === 'download') material.downloads = Number(material.downloads || 0) + 1;
      if (action === 'complete') material.completed = true;
      if (action === 'bookmark') material.bookmarked = !material.bookmarked;
      material.updatedAt = new Date().toISOString();
      materials[idx] = material;
      writeMockMaterials(materials);
      return res.status(200).json(material);
    }

    const material = await StudyMaterial.findById(id);
    if (!material) return res.status(404).json({ message: 'Material not found' });
    if (action === 'view') material.views += 1;
    if (action === 'download') material.downloads += 1;
    if (action === 'complete') material.completed = true;
    if (action === 'bookmark') material.bookmarked = !material.bookmarked;
    await material.save();
    res.status(200).json(material);
  } catch (error) {
    res.status(400).json({ message: 'Error updating material activity', error: error.message });
  }
};

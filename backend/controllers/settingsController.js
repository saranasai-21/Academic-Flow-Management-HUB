import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting.js';

const defaults = {
  key: 'primary',
  schoolName: 'School Management System',
  adminName: 'School Administrator',
  adminEmail: 'admin@school.edu',
  academicYear: '2026-2027',
  currency: 'INR',
  attendanceThreshold: 75
};

export const getSettings = async (req, res) => {
  try {
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'primary' },
      { $setOnInsert: defaults },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Error loading settings', error: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const allowed = ['schoolName', 'adminName', 'adminEmail', 'academicYear', 'currency', 'attendanceThreshold'];
    const updates = Object.fromEntries(allowed.filter(key => req.body[key] !== undefined).map(key => [key, req.body[key]]));
    const settings = await SystemSetting.findOneAndUpdate(
      { key: 'primary' },
      { $set: updates, $setOnInsert: { key: 'primary' } },
      { new: true, upsert: true, runValidators: true }
    );
    res.json(settings);
  } catch (error) {
    res.status(400).json({ message: 'Error updating settings', error: error.message });
  }
};

export const runDiagnostics = async (req, res) => {
  try {
    const ping = await mongoose.connection.db.admin().ping();
    const collections = await mongoose.connection.db.listCollections().toArray();
    res.json({
      status: ping.ok === 1 ? 'Operational' : 'Degraded',
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
      collections: collections.length,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Database diagnostics failed', error: error.message });
  }
};

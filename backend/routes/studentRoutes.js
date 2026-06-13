import express from 'express';
import {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getDashboardStats
} from '../controllers/studentController.js';

const router = express.Router();

// Stats route must be placed BEFORE dynamic :id parameter route
router.get('/stats', getDashboardStats);

// Standard CRUD routes
router.get('/', getAllStudents);
router.post('/', createStudent);

router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export default router;

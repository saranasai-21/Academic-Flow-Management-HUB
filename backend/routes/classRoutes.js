import express from 'express';
import {
  getClasses,
  createClass,
  updateClass,
  applyClassFeeToStudents,
  seedDefaultClasses,
  deleteClass
} from '../controllers/classController.js';

const router = express.Router();

router.get('/', getClasses);
router.post('/', createClass);
router.post('/defaults', seedDefaultClasses);
router.put('/:id', updateClass);
router.post('/:id/apply-fees', applyClassFeeToStudents);
router.delete('/:id', deleteClass);

export default router;

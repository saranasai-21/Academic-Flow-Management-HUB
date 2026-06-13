import express from 'express';
import {
  getParents,
  createParent,
  updateParent,
  deleteParent,
  linkStudentToParent,
  unlinkStudentFromParent
} from '../controllers/parentController.js';

const router = express.Router();

router.get('/', getParents);
router.post('/', createParent);
router.put('/:id', updateParent);
router.delete('/:id', deleteParent);
router.post('/link', linkStudentToParent);
router.post('/unlink', unlinkStudentFromParent);

export default router;

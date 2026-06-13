import express from 'express';
import {
  createMaterial,
  getMaterials,
  recordMaterialActivity,
  updateMaterial
} from '../controllers/materialController.js';

const router = express.Router();

router.get('/', getMaterials);
router.post('/', createMaterial);
router.put('/:id', updateMaterial);
router.post('/:id/activity', recordMaterialActivity);

export default router;

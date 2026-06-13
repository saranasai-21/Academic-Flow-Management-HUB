import express from 'express';
import {
  getNotices,
  createNotice,
  deleteNotice
} from '../controllers/noticeController.js';

const router = express.Router();

router.get('/', getNotices);
router.post('/', createNotice);
router.delete('/:id', deleteNotice);

export default router;

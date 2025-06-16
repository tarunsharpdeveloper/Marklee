import express from 'express';
import adminController from '../controllers/adminController.js';
import isAdmin from '../middlewares/admin.js';

const router = express.Router();

router.get('/users', isAdmin, adminController.getUsers);
router.post('/brief-question', isAdmin, adminController.createBriefQuestion);
router.get('/brief-questions', isAdmin, adminController.getBriefQuestions);
export default router;
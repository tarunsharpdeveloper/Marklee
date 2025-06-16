import express from 'express';
import adminController from '../controllers/adminController.js';
import isAdmin from '../middlewares/admin.js';

const router = express.Router();

//user routes
router.get('/users', isAdmin, adminController.getUsers);
router.post('/user/update-status', isAdmin, adminController.updateUserStatus);

//brief question routes
router.post('/brief-question', isAdmin, adminController.createBriefQuestion);
router.get('/brief-questions', isAdmin, adminController.getBriefQuestions);
router.delete('/brief-question/:id', isAdmin, adminController.deleteBriefQuestion);
export default router;
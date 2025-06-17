import express from 'express';
import adminController from '../controllers/adminController.js';
import isAdmin from '../middlewares/admin.js';

const router = express.Router();
router.use(isAdmin);
//user routes
router.get('/users', adminController.getUsers);
router.post('/user/update-status', adminController.updateUserStatus);

//brief question routes
router.post('/brief-question', adminController.createBriefQuestion);
router.get('/brief-questions', adminController.getBriefQuestions);
router.delete('/brief-question/:id', adminController.deleteBriefQuestion);
export default router;
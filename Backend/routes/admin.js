import express from 'express';
import adminController from '../controllers/adminController.js';
import isAdmin from '../middlewares/admin.js';

const router = express.Router();
router.get('/brief-questions', adminController.getBriefQuestions);
router.use(isAdmin);
//user routes
router.get('/users', adminController.getUsers);
router.post('/user/update-status', adminController.updateUserStatus);

//brief question routes
router.post('/brief-question', adminController.createBriefQuestion);
router.delete('/brief-question/:id', adminController.deleteBriefQuestion);

//ai prompts routes
router.get('/ai-prompts', adminController.getAiPrompts);
router.get('/ai-prompt-for/:id', adminController.getAiPromptFor);
router.post('/ai-prompt', adminController.createAiPrompt);
router.put('/ai-prompt/:id', adminController.updateAiPrompt);
router.delete('/ai-prompt/:id', adminController.deleteAiPrompt);
router.get('/ai-prompts-type', adminController.getAiPromptsType);
router.post('/reset-default-prompts', adminController.resetDefaultPrompts);

export default router;
import express from 'express';
import adminController from '../controllers/adminController.js';
import isAdmin from '../middlewares/admin.js';

const router = express.Router();

router.get('/users', isAdmin, adminController.getUsers);

export default router;
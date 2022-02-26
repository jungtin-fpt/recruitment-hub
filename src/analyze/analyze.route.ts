import express from 'express';
import { body } from 'express-validator';
import validationMiddleware from '../middlewares/validator.middleware';
import { analyzeController } from './analyze.controller';
const router = express.Router();

router.get(
	'/',
	[
		body('sectionId').notEmpty().withMessage('must be specify').isInt().withMessage('must be integer'),
	],
	validationMiddleware,
	analyzeController
);

export default router;

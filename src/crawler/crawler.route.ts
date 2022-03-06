import express from 'express';
import { body } from 'express-validator';
import validationMiddleware from '../middlewares/validator.middleware';
import { crawlController } from './crawler.controller';
const router = express.Router();

router.post(
	'/',
	[
		body('keyword').notEmpty().withMessage('must be specify'),
		body('headless').optional().isBoolean().withMessage('must be boolean'),
	],
	validationMiddleware,
	crawlController
);

export default router;

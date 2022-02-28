import express from 'express';
import { body, param } from 'express-validator';
import validationMiddleware from '../middlewares/validator.middleware';
import { getSkillController, getSkillsController, updateSkillController } from './skill.controller';

const router = express.Router();
router.post(
	'/',
	[
		body('isOmit').optional().isBoolean().withMessage('must be boolean'),
		body('isVerified').optional().isBoolean().withMessage('must be boolean'),
	],
	validationMiddleware,
	getSkillsController
);

router.patch(
	'/:id',
	[
		param('id')
			.notEmpty()
			.withMessage('must be specify')
			.isNumeric()
			.withMessage('must be number')
			.toInt(),
		body('method').isIn(['omit', 'verify']).withMessage('must be \'omit\' or \'verify\''),
		body('value')
			.notEmpty()
			.withMessage('must be specify')
			.isBoolean()
			.withMessage('must be boolean')
			.toBoolean(),
	],
	validationMiddleware,
	updateSkillController
);

router.get(
	'/:id',
	[
		param('id')
			.notEmpty()
			.withMessage('must be specify')
			.isNumeric()
			.withMessage('must be number')
			.toInt(),
	],
	validationMiddleware,
	getSkillController
);

export default router;

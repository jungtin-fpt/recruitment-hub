import express from 'express';
import { body, param } from 'express-validator';
import { SECTION_STATE } from '../job/utils/section-state';
import validationMiddleware from '../middlewares/validator.middleware';
import {
	getSectionController,
	getSectionsController,
	updateSectionController,
} from './section.controller';
const router = express.Router();

router.get(
	'/',
	[
		body('status')
			.isEmpty()
			.withMessage('must be specified')
			.isIn([SECTION_STATE.PROCESSING, SECTION_STATE.STOPPED, SECTION_STATE.COMPLETED])
			.withMessage('value must in (processing | stopped | completed)'),
	],
	validationMiddleware,
	getSectionsController
);

router.get(
	'/:id',
	[param('id').isEmpty().withMessage('must be specified').isInt().withMessage('must be number')],
	validationMiddleware,
	getSectionController
);

router.patch(
	'/:id',
	[
		param('id').isEmpty().withMessage('must be specified').isInt().withMessage('must be number'),
		body('status')
			.isEmpty()
			.withMessage('must be specified')
			.isIn([SECTION_STATE.PROCESSING, SECTION_STATE.STOPPED, SECTION_STATE.COMPLETED])
			.withMessage('value must in (processing | stopped | completed)'),
	],
	validationMiddleware,
	updateSectionController
);

export default router;

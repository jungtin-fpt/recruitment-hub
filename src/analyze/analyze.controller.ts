import { NextFunction, Request, Response } from 'express';
import { analyzeAndGenerateReport } from './analyze.service';

export async function analyzeController(req: Request, res: Response, next: NextFunction) {
	try {
		const maps = await analyzeAndGenerateReport(req.body.sectionId);
        res.json(maps);
	} catch (err) {
		next(err);
	}
}

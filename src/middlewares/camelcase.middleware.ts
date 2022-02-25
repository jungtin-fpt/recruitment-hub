import camelcaseKeys from 'camelcase-keys';
import { NextFunction, Request, Response } from 'express';

const camelCaseMiddleware = () => {
	return function (req: Request, res: Response, next: NextFunction) {
		req.body = camelcaseKeys(req.body, { deep: true });
		req.params = camelcaseKeys(req.params);
		req.query = camelcaseKeys(req.query);
		next();
	};
};

export default camelCaseMiddleware;

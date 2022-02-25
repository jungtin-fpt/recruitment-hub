import omitEmpty from 'omit-empty';
import { NextFunction, Request, Response } from 'express';

const removeEmptyProperties = () => {
	return function (req: Request, res: Response, next: NextFunction) {
		req.body = omitEmpty(req.body);
		req.params = { ...omitEmpty(req.params) };
		req.query = { ...omitEmpty(req.query) };
		next();
	};
};

export default removeEmptyProperties;

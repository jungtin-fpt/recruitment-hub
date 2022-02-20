import { Request, Response } from 'express';

import express from 'express';
import config from './config';
import { createConnection, getManager } from 'typeorm';

createConnection().then((connection) => {
	console.log(connection.isConnected);
	getManager(connection.name).transaction(e => {
		return Promise.resolve();
	})

	const app = express();
	/* Middleware */
	app.use(express.urlencoded({ extended: false }));
	app.use(express.json());

	app.get('/', (req: Request, res: Response) => {
		res.json({ message: 'Xin chào' });
	});

	app.listen(config.port, () => {
		console.log(`Server is running on PORT: ${config.port}`);
	});
});

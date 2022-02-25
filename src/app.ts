import sse, { ISseFunctions, ISseResponse } from '@toverux/expresse';
import { ISseHandlerResponse } from '@toverux/expresse/dist/src/sse_handler_middleware';
import EventEmitter from 'events';
import express, { Request, Response } from 'express';
import path from 'path';
import { createConnection } from 'typeorm';
import config from './config';
import crawlerRouter from './crawler/crawler.route';
import logger from './logger';
import camelCaseMiddleware from './middlewares/camelcase.middleware';
import omitEmptyMiddleware from './middlewares/omit-empty.middleware';
import skillRouter from './skill-suggestor/skill.route';
import { topCvCrawler } from './crawler/crawler.service';
import { EmitterLogger } from './logger/emitter-logger.types';

const app = express();
/* Middleware */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(camelCaseMiddleware());
app.use(omitEmptyMiddleware());

app.use('/skills', skillRouter);
app.use('/crawler', crawlerRouter);

app.get('/events', sse(), (req: Request, res: any) => {
	const resp = res as ISseResponse;
	console.log('SSE event has been opened');

	topCvCrawler.on('log', (data: EmitterLogger) => {
		resp.sse.event('topcv-event', data);
	})

	resp.on('close', () => {
		console.log('SSE event has been closed');
	})
	/* 
		Chúng ta nên chủ động res.end() để tránh conflict
		- Custom event room: resp.sse.event('custom-event', 'data sent to custom event');
		- Default event room: resp.sse.data('data');
	*/
});

app.get('/', (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, '..', 'resources', 'index.html'));
});

createConnection().then((connection) => {
	logger.info(`Database Connecting: ${connection.isConnected}`);
	app.listen(config.port, () => {
		console.log(`Server is running on PORT: ${config.port}`);
	});
});

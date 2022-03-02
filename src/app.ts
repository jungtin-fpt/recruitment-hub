import sse, { ISseResponse } from '@toverux/expresse';
import express, { Request, Response } from 'express';
import path from 'path';
import { createConnection } from 'typeorm';
import config from './config';
import crawlerRouter from './crawler/crawler.route';
import {
	topCvCrawler as TopCvCrawler,
	vieclam365Crawler as Vieclam365Crawler,
	topDevCrawler as TopDevCrawler,
	careerBuilderCrawler as CareerBuilderCrawler,
	isAvailable,
} from './crawler/crawler.service';
import logger from './logger';
import { EmitterLogger } from './emitter/emitter-logger.types';
import camelCaseMiddleware from './middlewares/camelcase.middleware';
import omitEmptyMiddleware from './middlewares/omit-empty.middleware';
import sectionRouter from './section/section.route';
import skillRouter from './skill-suggestor/skill.route';
import analyzeRouter from './analyze/analyze.route';
import DefaultEmitter from './emitter/default-emitter';

process.setMaxListeners(0);
const app = express();
/* Middleware */
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(camelCaseMiddleware());
app.use(omitEmptyMiddleware());

app.get('/', (req: Request, res: Response) => {
	res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});
app.use('/static', express.static(path.resolve(__dirname, '../dist')));
app.use('/skills', skillRouter);
app.use('/crawler', crawlerRouter);
app.use('/sections', sectionRouter);
app.use('/analyze', analyzeRouter);
app.get('/events', sse(), (req: Request, res: any) => {
	const resp = res as ISseResponse;
	console.log('SSE event has been opened');
	resp.sse.event('status', isAvailable);

	TopCvCrawler.on('log', (data: EmitterLogger) => {
		resp.sse.event('topcv-event', data);
	});

	TopDevCrawler.on('log', (data: EmitterLogger) => {
		resp.sse.event('topdev-event', data);
	});

	Vieclam365Crawler.on('log', (data: EmitterLogger) => {
		resp.sse.event('vieclam365-event', data);
	});

	CareerBuilderCrawler.on('log', (data: EmitterLogger) => {
		resp.sse.event('careerbuilder-event', data);
	});

	DefaultEmitter.on('log', (data: EmitterLogger) => {
		resp.sse.event('default', data);
	});

	DefaultEmitter.on('status', (isAvailable: boolean) => {
		resp.sse.event('status', isAvailable);
	});

	resp.on('close', () => {
		console.log('SSE event has been closed');
		// TopCvCrawler.removeAllListeners();
		// DefaultEmitter.removeAllListeners();
	});
	/* 
		Chúng ta nên chủ động res.end() để tránh conflict
		- Custom event room: resp.sse.event('custom-event', 'data sent to custom event');
		- Default event room: resp.sse.data('data');
	*/
});

createConnection().then((connection) => {
	logger.info(`Database Connecting: ${connection.isConnected}`);
	app.listen(config.port, () => {
		console.log(`Server is running on PORT: ${config.port}`);
	});
});

import EventEmitter from 'events';
import { JobDetailDTO } from '../job/job-detail.dto';
import logger from '../logger';
import { EmitterLogger } from '../logger/emitter-logger.types';

abstract class AbstractCrawler extends EventEmitter {
	abstract crawl(
		keyword: string,
		headless: boolean,
		baseUrl?: string,
		searchUrl?: string
	): Promise<JobDetailDTO[]>;

	log(level: 'info' | 'warn' | 'error', data: string | object, omitSystemLogger?: boolean) {
		if (!data) logger.warn('Fail to log something to client: ' + data.toString());
		if(!omitSystemLogger)
			logger.log({
				level,
				message: typeof data === 'object' ? JSON.stringify(data) : data,
			});
		this.emit('log', {
			type: typeof data,
			level,
			data: typeof data === 'object' ? JSON.stringify(data) : data,
		} as EmitterLogger);
	}
}

export default AbstractCrawler;
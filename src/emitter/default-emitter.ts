import EventEmitter from "events";
import logger from "../logger";
import { EmitterLogger } from "./emitter-logger.types";

class DefaultEmitter extends EventEmitter {
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

    status(isAvailable: boolean) {
        this.emit('status', isAvailable);
    }
}

export default new DefaultEmitter();
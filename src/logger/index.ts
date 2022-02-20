import { createLogger, format, transports } from 'winston';
import config from '../config';
const { combine, timestamp, printf, colorize, errors, prettyPrint } = format;

const customFormat = printf(({ level, message, timestamp, stack, ...metadata }) => {
	if (stack) console.error(stack, message);

	message = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
	return `${timestamp} - [${level}]${metadata.meta ? `[${metadata.meta}]` : ''} : ${
		stack || message
	}`;
});

const createDevLogger = function () {
	return createLogger({
		level: config.logger.level,
		format: combine(
			colorize(),
			prettyPrint(),
			errors({ stack: true }),
			timestamp({
				format: 'DD/MM/YYYY hh:mm:ss',
			}),
			customFormat
		),
		transports: [new transports.Console()],
	});
};

const createProdLogger = function () {
	return createLogger({
		level: config.logger.level,
		format: combine(
			colorize(),
			errors({ stack: true }),
			timestamp({
				format: 'DD/MM/YYYY hh:mm:ss',
			}),
			customFormat
		),
		transports: [new transports.Console()],
	});
};

const logger = config.env === 'development' ? createDevLogger() : createProdLogger();
export default logger;

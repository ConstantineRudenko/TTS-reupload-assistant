import { existsSync } from 'fs';
import { Args } from './parseArgs.ts';
import * as log from 'log';

function logFileFormatter(record: log.LogRecord) {
	const json = JSON.stringify(
		{
			time: record.datetime.toUTCString,
			level: record.level,
			levelName: record.levelName,
			message: record.msg,
			data: record.args,
		},
		null,
		2
	);
	return `${json}\n`;
}

export default function logSetup(args: Args) {
	const logDir = './logs';

	if (!existsSync(logDir)) {
		Deno.mkdirSync('./logs');
	}

	log.setup({
		handlers: {
			console: new log.ConsoleHandler('INFO', {
				// formatter: log.formatters.jsonFormatter,
				formatter: (record) =>
					`[${record.datetime.toLocaleTimeString()}] ${
						record.levelName
					}: ${record.msg}${
						record.args.length
							? `\n${JSON.stringify(record.args, null, 2)}`
							: ''
					}`,
				useColors: true,
			}),
			file: new log.FileHandler(args.verbose ? 'DEBUG' : 'INFO', {
				filename: `./logs/${new Date()
					.toISOString()
					.replaceAll(':', '-')}.log`,
				formatter: logFileFormatter,
				mode: 'x',
			}),
			fileError: new log.FileHandler('ERROR', {
				filename: `./logs/${new Date()
					.toISOString()
					.replaceAll(':', '-')}.ERROR.log`,
				formatter: logFileFormatter,
				mode: 'x',
			}),
		},
		loggers: {
			default: {
				level: 'DEBUG',
				handlers: ['console', 'file', 'fileError'],
			},
			progress: {
				level: 'DEBUG',
				handlers: ['console'],
			},
		},
	});
}

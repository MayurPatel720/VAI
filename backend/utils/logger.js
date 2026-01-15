/**
 * Centralized logging utility for Vachanamrut AI
 * Provides structured logging with different levels
 */

const isDevelopment = process.env.NODE_ENV !== 'production';

const colors = {
	reset: '\x1b[0m',
	red: '\x1b[31m',
	green: '\x1b[32m',
	yellow: '\x1b[33m',
	blue: '\x1b[34m',
	magenta: '\x1b[35m',
	cyan: '\x1b[36m',
};

class Logger {
	constructor(context = 'APP') {
		this.context = context;
	}

	_formatMessage(level, message, data) {
		const timestamp = new Date().toISOString();
		const prefix = `[${timestamp}] [${level}] [${this.context}]`;
		
		if (data) {
			return `${prefix} ${message} ${JSON.stringify(data)}`;
		}
		return `${prefix} ${message}`;
	}

	info(message, data) {
		if (isDevelopment) {
			console.log(`${colors.blue}ℹ${colors.reset}`, this._formatMessage('INFO', message, data));
		}
	}

	success(message, data) {
		if (isDevelopment) {
			console.log(`${colors.green}✓${colors.reset}`, this._formatMessage('SUCCESS', message, data));
		}
	}

	warn(message, data) {
		console.warn(`${colors.yellow}⚠${colors.reset}`, this._formatMessage('WARN', message, data));
	}

	error(message, error) {
		const errorData = error instanceof Error ? {
			message: error.message,
			stack: error.stack,
		} : error;
		console.error(`${colors.red}✖${colors.reset}`, this._formatMessage('ERROR', message, errorData));
	}

	debug(message, data) {
		if (isDevelopment) {
			console.log(`${colors.cyan}🔍${colors.reset}`, this._formatMessage('DEBUG', message, data));
		}
	}
}

// Create default logger instance
const logger = new Logger('APP');

// Export both the class and default instance
module.exports = { Logger, logger };

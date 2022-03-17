import * as convict from 'convict';

/* 
	Default Formats : *, int, port, windows_named_pipe, port_or_windows_named_pipe, nat(natural number)
	Convict-format-with-validator: email, ipaddress(IPv4 and IPv6 addresses), url
	Convict-format-with-moment : 
	- duration - milliseconds or a human readable string (e.g. 3000, "5 days")
	- timestamp - Unix timestamps or date strings recognized by Moment.js
*/
convict.addFormat(require('convict-format-with-validator').ipaddress);
convict.addFormat(require('convict-format-with-validator').email);
convict.addFormat(require('convict-format-with-validator').url);

// Define a schema
var config = convict.default({
	env: {
		// doc: "The application environment.",
		format: ['production', 'development', 'test'],
		default: 'development',
		env: 'NODE_ENV',
	},
	port: {
		format: 'port',
		default: 8080,
		env: 'PORT',
	},

	/* Database */
	db: {
		database: {
			format: String,
			default: '',
			env: 'DB_DATABASE',
		},
		host: {
			format: String,
			default: '',
			env: 'DB_HOSTNAME',
		},
		username: {
			format: String,
			default: '',
			env: 'DB_USERNAME',
		},
		password: {
			format: String,
			default: '',
			env: 'DB_PASSWORD',
		},
		port: {
			format: Number,
			default: 3306,
			env: 'DB_PORT',
		},
		dialect: {
			format: String,
			default: 'mysql',
			env: 'DB_DIALECT',
		},
		dialectOptions: {
			format: Object,
			default: {
				bigNumberStrings: true,
			},
		},
		entityFilter: {
			format: String,
			default: "src/entity/**/*.ts",
			env: 'DB_ENTITY_FILTER',
		},
		migrationFilter: {
			format: String,
			default: "src/migration/**/*.ts",
			env: 'DB_MIGRATION_FILTER',
		},
		subscriberFilter: {
			format: String,
			default: "src/subscriber/**/*.ts",
			env: 'DB_SUBSCRIBER_FILTER',
		},
		entitiesDir: {
			format: String,
			default: "src/entity",
			env: 'DB_ENTITIES_DIR',
		},
		migrationsDir: {
			format: String,
			default: "src/migration",
			env: 'DB_MIGRATIONS_DIR',
		},
		subscribersDir: {
			format: String,
			default: "src/subscriber",
			env: 'DB_SUBSCRIBERS_DIR',
		},
		logging: {
			format: Boolean,
			default: true,
			env: 'DB_LOGGING',
		},
		synchronize: {
			format: Boolean,
			default: true,
			env: 'DB_SYNCHRONIZE',
		},
	},

	logger: {
		level: {
			format: String,
			default: 'debug',
			env: 'LOGGER_LEVEL',
		},
	},
});

// Load environment dependent configuration
// var env = config.get('env');
// config.loadFile('./config/config.json');
// if (env === "development") config.loadFile("./config/" + env + ".json");

// Perform validation
config.validate({ allowed: 'strict' });

export default config.getProperties();

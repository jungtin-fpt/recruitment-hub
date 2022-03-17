module.exports = {
	apps: [
		{
			name: 'hub',
			script: './dist/app.js',
			env: {
				PORT: 8080,
				DB_DATABASE: 'rhub',
				DB_HOSTNAME: 'localhost',
				DB_USERNAME: 'root',
				DB_PASSWORD: 'admin',
				DB_PORT: 3306,

				DB_ENTITY_FILTER: 'dist/entity/**/*.js',
				DB_MIGRATION_FILTER: 'dist/migration/**/*.js',
				DB_SUBSCRIBER_FILTER: 'dist/subscriber/**/*.js',
				DB_ENTITIES_DIR: 'dist/entity',
				DB_MIGRATIONS_DIR: 'dist/migration',
				DB_SUBSCRIBERS_DIR: 'dist/subscriber',

				DB_LOGGING: true,
				DB_SYNCHRONIZE: true,
			},
		},
	],
};

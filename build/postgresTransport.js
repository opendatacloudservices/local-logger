"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresTransport = void 0;
const Transport = require("winston-transport");
const pg_1 = require("pg");
class PostgresTransport extends Transport {
    constructor(opts) {
        super(opts);
        if (!('LOGGER_PGUSER' in process.env) ||
            !('LOGGER_PGHOST' in process.env) ||
            !('LOGGER_PGDATABASE' in process.env) ||
            !('LOGGER_PGPASSWORD' in process.env)) {
            throw Error('Missing environmental variables for database connection');
        }
        // connect to postgres (via env vars params)
        this.client = new pg_1.Client({
            user: process.env.LOGGER_PGUSER,
            host: process.env.LOGGER_PGHOST,
            database: process.env.LOGGER_PGDATABASE,
            password: process.env.LOGGER_PGPASSWORD,
            port: parseInt(process.env.LOGGER_PGPORT || '5432'),
        });
        this.client.connect();
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        let stack = new Error().stack || '';
        if ('meta' in info && 'stack' in info.meta && 'error' in info.meta) {
            info.message = info.meta.message || info.meta.error || '';
            stack = info.meta.stack || '';
        }
        const fullStack = stack
            .split('\n')
            .map(line => line.trim())
            .filter(line => line !== 'Error:');
        const lightStack = [];
        let stack_end = false;
        for (let j = fullStack.length - 1; j >= 0 && !stack_end; j -= 1) {
            if (fullStack[j].indexOf('/local-logger') === -1) {
                lightStack.push(fullStack[j]);
            }
            else {
                stack_end = true;
            }
        }
        const parameters = [
            info.type || 'unknown',
            null,
            info.duration || ('meta' in info ? info.meta.duration : 0) || 0,
            info.success || null,
            lightStack || null,
            fullStack || null,
            info.token || ('meta' in info ? info.meta.token || null : null),
            info.tokenParent ||
                ('meta' in info ? info.meta.tokenParent || null : null),
            'meta' in info ? info.meta.expressRoute || null : null,
            'meta' in info ? info.meta.expressMethod || null : null,
            'meta' in info ? info.meta.expressQuery || null : null,
            'meta' in info ? info.meta.expressOrigin || null : null,
            process.env.NODE_ENV || 'unknown',
            process.env.SERVICE_NAME || 'unknown',
        ];
        [
            'type',
            'duration',
            'success',
            'token',
            'tokenParent',
            'expressRoute',
            'expressMethod',
            'expressQuery',
            'expressOrigin',
            'level',
            'meta',
            'start',
            'end',
        ].forEach((key) => {
            delete info[key];
        });
        parameters[1] = info;
        this.client
            .query(`INSERT INTO "Logs" (
          type,
          message,
          transaction_duration,
          transaction_success,
          stack,
          full_stack,
          token,
          token_parent,
          express_route,
          express_method,
          express_query,
          express_origin,
          env,
          service
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`, parameters)
            .then(() => {
            if (callback) {
                callback();
            }
        })
            .catch(err => {
            throw err;
        });
    }
}
exports.PostgresTransport = PostgresTransport;
//# sourceMappingURL=postgresTransport.js.map
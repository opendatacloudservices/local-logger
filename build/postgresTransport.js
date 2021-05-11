"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresTransport = void 0;
const Transport = require("winston-transport");
const pg_1 = require("pg");
const index_1 = require("./index");
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
    log(pInfo, callback) {
        // creating a copy of the original message to make sure, transactions stay alive
        const info = JSON.parse(JSON.stringify(pInfo));
        setImmediate(() => {
            this.emit('logged', info);
        });
        let stack = info.stack ? info.stack.join('\n') : '';
        if ('meta' in info && 'stack' in info.meta && 'error' in info.meta) {
            info.message = info.meta.message
                ? info.meta.message
                : info.meta.error
                    ? { error: info.meta.error }
                    : { message: '' };
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
            info.type ||
                ('meta' in info && info.meta && 'type' in info.meta
                    ? info.meta.type
                    : 'message' in info && info.message && 'type' in info.message
                        ? info.message.type
                        : 'unknown'),
            null,
            info.duration || ('meta' in info ? info.meta.duration : 0) || 0,
            info.success || null,
            lightStack || null,
            fullStack || null,
            info.token ||
                info[index_1.tokenKey] ||
                ('meta' in info
                    ? info.meta.token || info.meta[index_1.tokenKey] || null
                    : null),
            info.tokenParent ||
                info[index_1.tokenKeyParent] ||
                ('meta' in info
                    ? info.meta.tokenParent || info.meta[index_1.tokenKeyParent] || null
                    : null),
            'meta' in info ? info.meta.expressRoute : null,
            'meta' in info ? info.meta.expressMethod : null,
            'meta' in info ? info.meta.expressQuery : null,
            'meta' in info ? info.meta.expressOrigin : null,
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)`, parameters)
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
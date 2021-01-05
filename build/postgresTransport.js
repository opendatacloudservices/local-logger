"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresTransport = void 0;
const Transport = require("winston-transport");
const pg_1 = require("pg");
class PostgresTransport extends Transport {
    constructor(opts) {
        super(opts);
        if (!('PGUSER' in process.env) ||
            !('PGHOST' in process.env) ||
            !('PGDATABASE' in process.env) ||
            !('PGPASSWORD' in process.env)) {
            throw Error('Missing environmental variables for database connection');
        }
        // connect to postgres (via env vars params)
        this.client = new pg_1.Client({
            user: process.env.PGUSER,
            host: process.env.PGHOST,
            database: process.env.PGDATABASE,
            password: process.env.PGPASSWORD,
            port: parseInt(process.env.PGPORT || '5432'),
        });
        this.client.connect();
    }
    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });
        const stack = new Error().stack || '';
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
            info.duration || 0,
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
            .query(`INSERT INTO logs (
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
          env
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
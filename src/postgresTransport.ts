import * as Transport from 'winston-transport';
import {Client} from 'pg';
import {tokenKey, tokenKeyParent} from './index';

export class PostgresTransport extends Transport {
  client: Client;

  constructor(opts: {}) {
    super(opts);

    if (
      !('LOGGER_PGUSER' in process.env) ||
      !('LOGGER_PGHOST' in process.env) ||
      !('LOGGER_PGDATABASE' in process.env) ||
      !('LOGGER_PGPASSWORD' in process.env)
    ) {
      throw Error('Missing environmental variables for database connection');
    }

    // connect to postgres (via env vars params)
    this.client = new Client({
      user: process.env.LOGGER_PGUSER,
      host: process.env.LOGGER_PGHOST,
      database: process.env.LOGGER_PGDATABASE,
      password: process.env.LOGGER_PGPASSWORD,
      port: parseInt(process.env.LOGGER_PGPORT || '5432'),
    });

    this.client.connect();
  }

  log(
    pInfo: {
      transactionId?: string;
      type: string;
      duration?: number;
      success?: boolean;
      stack?: string[];
      fullStack?: string[];
      token?: string;
      tokenParent?: string;
      message?: {
        [key: string]: string;
      };
      meta: {
        transactionId?: string;
        expressRoute?: string;
        expressMethod?: string;
        expressQuery?: {};
        expressOrigin?: string;
        token?: string;
        tokenParent?: string;
        duration?: number;
        stack?: string;
        error?: string;
        message?: {
          [key: string]: string;
        };
        type?: string;
        [tokenKey]?: string;
        [tokenKeyParent]?: string;
      };
    } & {
      [key: string]: string | {} | string[] | boolean | number | undefined;
    },
    callback: Function | null
  ) {
    // creating a copy of the original message to make sure, transactions stay alive
    const info = JSON.parse(JSON.stringify(pInfo));

    setImmediate(() => {
      this.emit('logged', info);
    });

    let stack: string = info.stack ? info.stack.join('\n') : '';
    if ('meta' in info && 'stack' in info.meta && 'error' in info.meta) {
      info.message = info.meta.message
        ? info.meta.message
        : info.meta.error
        ? {error: info.meta.error}
        : {message: ''};
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
      } else {
        stack_end = true;
      }
    }

    const parameters = [
      info.type ||
        ('meta' in info && info.meta && 'type' in info.meta
          ? info.meta.type
          : undefined) ||
        ('message' in info &&
        info.message &&
        typeof info.message === 'object' &&
        'type' in info.message
          ? info.message.type
          : undefined) ||
        'unknown',
      null,
      info.duration || ('meta' in info ? info.meta.duration : 0) || 0,
      info.success || null,
      info.transactionId ||
        ('meta' in info && info.meta && 'transactionId' in info.meta
          ? info.meta.transactionId
          : undefined) ||
        ('message' in info &&
        info.message &&
        typeof info.message === 'object' &&
        'transactionId' in info.message
          ? info.message.transactionId
          : undefined) ||
        null,
      lightStack || null,
      fullStack || null,
      info.token ||
        info[tokenKey] ||
        ('meta' in info ? info.meta.token || info.meta[tokenKey] : undefined) ||
        ('message' in info && info.message && typeof info.message === 'object'
          ? info.message.token || info.message[tokenKey] || null
          : undefined) ||
        null,
      info.tokenParent ||
        info[tokenKeyParent] ||
        ('meta' in info
          ? info.meta.tokenParent || info.meta[tokenKeyParent]
          : undefined) ||
        ('message' in info && info.message && typeof info.message === 'object'
          ? info.message.tokenParent || info.message[tokenKeyParent]
          : undefined) ||
        null,
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
    ].forEach((key: string) => {
      delete info[key];
    });

    parameters[1] = info;

    this.client
      .query(
        `INSERT INTO "Logs" (
          type,
          message,
          transaction_duration,
          transaction_success,
          transaction_id,
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
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        parameters
      )
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

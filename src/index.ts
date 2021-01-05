Error.stackTraceLimit = Infinity;

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as winston from 'winston';
import * as express from 'express-winston';
import {PostgresTransport} from './postgresTransport';
import {v1 as uuidv1} from 'uuid';

// get environmental variables
dotenv.config({path: path.join(__dirname, '../.env')});

const transport = new PostgresTransport({});

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [transport],
});

const tokenKey = 'log___token';
const tokenKeyParent = 'log___tokenParent';

export const token = (id?: string): {[tokenKey]: string} => {
  const t: {[tokenKey]: string} = {log___token: ''};
  if (id) {
    t[tokenKey] = id;
  } else {
    t[tokenKey] = uuid();
  }
  return t;
};

export const tokenUrl = (id?: string): string => {
  if (id) {
    return tokenKey + '=' + id;
  } else {
    return tokenKey + '=' + uuid();
  }
};

export const getToken = (req: {query: {[tokenKey]?: string}}): string => {
  if (req.query && req.query[tokenKey]) {
    return req.query[tokenKey] || uuid();
  } else {
    return uuid();
  }
};

export const getTokenParent = (req: {
  query: {[tokenKeyParent]?: string};
}): string | undefined => {
  if (req.query && req.query[tokenKeyParent]) {
    return req.query[tokenKeyParent] || undefined;
  } else {
    return undefined;
  }
};

export const tokenRoute = (
  req: {query?: {[tokenKey]?: string; [tokenKeyParent]?: string}},
  _res: {},
  next: Function
) => {
  if (req.query && req.query[tokenKey]) {
    req.query[tokenKeyParent] = req.query[tokenKey] || '';
  }

  if (!('query' in req) || !req.query) {
    req.query = {};
  }
  req.query[tokenKey] = uuid();

  next();
};

export const logRoute = express.logger({
  transports: [transport],
  baseMeta: {
    type: 'express',
  },
  dynamicMeta: req => {
    const meta: {
      expressOrigin: string | undefined;
      expressRoute: string | undefined;
      expressMethod: string | undefined;
      expressQuery: {} | undefined;
      token: string | undefined;
      tokenParent: string | undefined;
    } = {
      expressOrigin: undefined,
      expressRoute: req.url || undefined,
      expressMethod: req.method || undefined,
      expressQuery: req.query || undefined,
      token:
        req.query && req.query[tokenKey]
          ? req.query[tokenKey]?.toString()
          : undefined,
      tokenParent:
        req.query && req.query[tokenKeyParent]
          ? req.query[tokenKeyParent]?.toString()
          : undefined,
    };

    const protocol = req.protocol;
    const hostHeaderIndex = req.rawHeaders.indexOf('Host') + 1;
    const host = hostHeaderIndex ? req.rawHeaders[hostHeaderIndex] : undefined;

    if (host) {
      meta.expressOrigin = protocol + '://' + host;
    } else {
      meta.expressOrigin = req.headers.referer
        ? req.headers.referer.substring(0, req.headers.referer.length - 1)
        : undefined;
    }

    return meta;
  },
});

export const logInfo = (message: {}) => {
  logger.info({...message, type: 'info'});
};

export const logError = (message: {}) => {
  logger.error({...message, type: 'error'});
};

export const startSpan = (message: {}) => {
  const meta = {
    ...message,
    type: 'transaction',
    start: new Date(),
    end: new Date(),
    duration: 0,
    success: false,
  };
  return (success: boolean, message?: {}) => {
    const log = message ? {...message, ...meta} : meta;

    log.end = new Date();
    log.duration = log.end.getTime() - log.start.getTime();
    log.success = success;

    if (success) {
      logger.info(log);
    } else {
      logger.error(log);
    }
  };
};

// span and transaction are handled equally and stored as type=transaction
export const startTransaction = startSpan;

export const uuid = (): string => uuidv1();

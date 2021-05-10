Error.stackTraceLimit = Infinity;

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as winston from 'winston';
import * as express from 'express-winston';
import {Request, Response} from 'express';
import {PostgresTransport} from './postgresTransport';
import {v1 as uuidv1} from 'uuid';

// get environmental variables
dotenv.config({path: path.join(__dirname, '../.env')});

const transport = new PostgresTransport({});

const logger = winston.createLogger({
  format: winston.format.json(),
  transports: [transport],
});

export const tokenKey = 'log___token';
export const tokenKeyParent = 'log___tokenParent';

export const tokenUrl = (id: string): string => {
  return tokenKey + '=' + id;
};

export const addToken = (url: string, res: Response): string => {
  if (url.indexOf('?') > -1) {
    url = url += '&' + tokenUrl(res.locals[tokenKey]);
  } else {
    url = url += '?' + tokenUrl(res.locals[tokenKey]);
  }
  return url;
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
  res: Response,
  next: Function
) => {
  if (req.query && req.query[tokenKey]) {
    req.query[tokenKeyParent] = req.query[tokenKey] || '';
    res.locals[tokenKeyParent] = req.query[tokenKeyParent];
  }

  if (!('query' in req) || !req.query) {
    req.query = {};
  }
  req.query[tokenKey] = uuid();
  res.locals[tokenKey] = req.query[tokenKey];

  if (!('start' in res.locals) || !res.locals.start) {
    res.locals.start = new Date().getTime();
  }

  next();
};

const dynamicMeta = (req: Request, res: Response) => {
  const meta: {
    expressOrigin: string | undefined;
    expressRoute: string | undefined;
    expressMethod: string | undefined;
    expressQuery: {} | undefined;
    token: string | undefined;
    tokenParent: string | undefined;
    duration?: number;
    resultCode?: number;
    resultBody?: string | {};
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

  const now = new Date().getTime();
  meta.duration = Math.abs(now - res.locals.start);

  if (res.statusCode) {
    meta.resultCode = res.statusCode;
  }

  if (res.json) {
    meta.resultBody = res.json;
  }

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
};

export const logRoute = express.logger({
  transports: [transport],
  format: winston.format.json(),
  baseMeta: {
    type: 'express-logRoute',
  },
  dynamicMeta: (req, res) => dynamicMeta(req, res),
});

export const logRouteError = express.errorLogger({
  transports: [transport],
  format: winston.format.json(),
  baseMeta: {
    type: 'express-logRouteError',
  },
  dynamicMeta: (req, res) => dynamicMeta(req, res),
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

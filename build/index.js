"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.startTransaction = exports.startSpan = exports.logError = exports.logInfo = exports.logRouteError = exports.logRoute = exports.dynamicMeta = exports.tokenRoute = exports.getTokenParent = exports.getToken = exports.addToken = exports.tokenUrl = exports.localTokens = exports.tokenKeyParent = exports.tokenKey = void 0;
Error.stackTraceLimit = Infinity;
const dotenv = require("dotenv");
const path = require("path");
const winston = require("winston");
const express = require("express-winston");
const postgresTransport_1 = require("./postgresTransport");
const uuid_1 = require("uuid");
// get environmental variables
dotenv.config({ path: path.join(__dirname, '../.env') });
const transport = new postgresTransport_1.PostgresTransport({});
const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [transport],
});
exports.tokenKey = 'log___token';
exports.tokenKeyParent = 'log___tokenParent';
const localTokens = (res) => {
    const tokens = {};
    if (exports.tokenKey in res.locals) {
        tokens[exports.tokenKey] = res.locals[exports.tokenKey];
    }
    if (exports.tokenKeyParent in res.locals) {
        tokens[exports.tokenKeyParent] = res.locals[exports.tokenKeyParent];
    }
    return tokens;
};
exports.localTokens = localTokens;
const tokenUrl = (id) => {
    return exports.tokenKey + '=' + id;
};
exports.tokenUrl = tokenUrl;
const addToken = (url, res) => {
    if (url.indexOf('?') > -1) {
        url = url += '&' + (0, exports.tokenUrl)(res.locals[exports.tokenKey]);
    }
    else {
        url = url += '?' + (0, exports.tokenUrl)(res.locals[exports.tokenKey]);
    }
    return url;
};
exports.addToken = addToken;
const getToken = (req) => {
    if (req.query && req.query[exports.tokenKey]) {
        return req.query[exports.tokenKey] || (0, exports.uuid)();
    }
    else {
        return (0, exports.uuid)();
    }
};
exports.getToken = getToken;
const getTokenParent = (req) => {
    if (req.query && req.query[exports.tokenKeyParent]) {
        return req.query[exports.tokenKeyParent] || undefined;
    }
    else {
        return undefined;
    }
};
exports.getTokenParent = getTokenParent;
const tokenRoute = (req, res, next) => {
    if (req.query && req.query[exports.tokenKey]) {
        req.query[exports.tokenKeyParent] = req.query[exports.tokenKey] || '';
        res.locals[exports.tokenKeyParent] = req.query[exports.tokenKeyParent];
    }
    if (!('query' in req) || !req.query) {
        req.query = {};
    }
    req.query[exports.tokenKey] = (0, exports.uuid)();
    res.locals[exports.tokenKey] = req.query[exports.tokenKey];
    if (!('start' in res.locals) || !res.locals.start) {
        res.locals.start = new Date().getTime();
    }
    next();
};
exports.tokenRoute = tokenRoute;
const dynamicMeta = (req, res) => {
    const meta = {
        expressOrigin: undefined,
        expressRoute: req.url || undefined,
        expressMethod: req.method || undefined,
        expressQuery: req.query || undefined,
        token: res.locals[exports.tokenKey] || '',
        tokenParent: res.locals[exports.tokenKeyParent] || '',
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
    }
    else {
        meta.expressOrigin = req.headers.referer
            ? req.headers.referer.substring(0, req.headers.referer.length - 1)
            : undefined;
    }
    return meta;
};
exports.dynamicMeta = dynamicMeta;
exports.logRoute = express.logger({
    transports: [transport],
    format: winston.format.json(),
    baseMeta: {
        type: 'express-logRoute',
    },
    dynamicMeta: (req, res) => (0, exports.dynamicMeta)(req, res),
});
exports.logRouteError = express.errorLogger({
    transports: [transport],
    format: winston.format.json(),
    baseMeta: {
        type: 'express-logRouteError',
    },
    dynamicMeta: (req, res) => (0, exports.dynamicMeta)(req, res),
});
const logInfo = (message) => {
    logger.info({ ...message, type: 'info' });
};
exports.logInfo = logInfo;
const logError = (message) => {
    logger.error({ ...message, type: 'error' });
};
exports.logError = logError;
const startSpan = (message) => {
    const meta = {
        ...message,
        type: 'transaction-start',
        start: new Date(),
        end: new Date(),
        duration: 0,
        transactionId: (0, exports.uuid)(),
        success: false,
    };
    logger.info(meta);
    return (success, message) => {
        const log = message ? { message, ...meta } : meta;
        log.end = new Date();
        log.duration = log.end.getTime() - log.start.getTime();
        log.success = success;
        log.type = 'transaction-end';
        if (success) {
            logger.info(log);
        }
        else {
            logger.error(log);
        }
    };
};
exports.startSpan = startSpan;
// span and transaction are handled equally and stored as type=transaction
exports.startTransaction = exports.startSpan;
const uuid = () => (0, uuid_1.v1)();
exports.uuid = uuid;
//# sourceMappingURL=index.js.map
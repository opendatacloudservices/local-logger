"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.startTransaction = exports.startSpan = exports.logError = exports.logInfo = exports.logRouteError = exports.logRoute = exports.tokenRoute = exports.getTokenParent = exports.getToken = exports.addToken = exports.tokenUrl = exports.token = exports.tokenKeyParent = exports.tokenKey = void 0;
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
const token = (id) => {
    const t = { log___token: '' };
    if (id) {
        t[exports.tokenKey] = id;
    }
    else {
        t[exports.tokenKey] = exports.uuid();
    }
    return t;
};
exports.token = token;
const tokenUrl = (id) => {
    if (id) {
        return exports.tokenKey + '=' + id;
    }
    else {
        return exports.tokenKey + '=' + exports.uuid();
    }
};
exports.tokenUrl = tokenUrl;
const addToken = (url, id) => {
    if (!id) {
        id = exports.uuid();
    }
    if (url.indexOf('?') > -1) {
        url = url += '&' + exports.tokenUrl(id);
    }
    else {
        url = url += '?' + exports.tokenUrl(id);
    }
    return url;
};
exports.addToken = addToken;
const getToken = (req) => {
    if (req.query && req.query[exports.tokenKey]) {
        return req.query[exports.tokenKey] || exports.uuid();
    }
    else {
        return exports.uuid();
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
    }
    if (!('query' in req) || !req.query) {
        req.query = {};
    }
    req.query[exports.tokenKey] = exports.uuid();
    if (!('start' in res.locals) || !res.locals.start) {
        res.locals.start = new Date().getTime();
    }
    next();
};
exports.tokenRoute = tokenRoute;
const dynamicMeta = (req, res) => {
    var _a, _b;
    const meta = {
        expressOrigin: undefined,
        expressRoute: req.url || undefined,
        expressMethod: req.method || undefined,
        expressQuery: req.query || undefined,
        token: req.query && req.query[exports.tokenKey]
            ? (_a = req.query[exports.tokenKey]) === null || _a === void 0 ? void 0 : _a.toString() : undefined,
        tokenParent: req.query && req.query[exports.tokenKeyParent]
            ? (_b = req.query[exports.tokenKeyParent]) === null || _b === void 0 ? void 0 : _b.toString() : undefined,
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
exports.logRoute = express.logger({
    transports: [transport],
    format: winston.format.json(),
    baseMeta: {
        type: 'express-logRoute',
    },
    dynamicMeta: (req, res) => dynamicMeta(req, res),
});
exports.logRouteError = express.errorLogger({
    transports: [transport],
    format: winston.format.json(),
    baseMeta: {
        type: 'express-logRouteError',
    },
    dynamicMeta: (req, res) => dynamicMeta(req, res),
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
        type: 'transaction',
        start: new Date(),
        end: new Date(),
        duration: 0,
        success: false,
    };
    return (success, message) => {
        const log = message ? { ...message, ...meta } : meta;
        log.end = new Date();
        log.duration = log.end.getTime() - log.start.getTime();
        log.success = success;
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
const uuid = () => uuid_1.v1();
exports.uuid = uuid;
//# sourceMappingURL=index.js.map
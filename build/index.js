"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uuid = exports.startTransaction = exports.startSpan = exports.logError = exports.logInfo = exports.logRoute = exports.tokenRoute = exports.getTokenParent = exports.getToken = exports.tokenUrl = exports.token = void 0;
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
const tokenKey = 'log___token';
const tokenKeyParent = 'log___tokenParent';
const token = (id) => {
    const t = { log___token: '' };
    if (id) {
        t[tokenKey] = id;
    }
    else {
        t[tokenKey] = exports.uuid();
    }
    return t;
};
exports.token = token;
const tokenUrl = (id) => {
    if (id) {
        return tokenKey + '=' + id;
    }
    else {
        return tokenKey + '=' + exports.uuid();
    }
};
exports.tokenUrl = tokenUrl;
const getToken = (req) => {
    if (req.query && req.query[tokenKey]) {
        return req.query[tokenKey] || exports.uuid();
    }
    else {
        return exports.uuid();
    }
};
exports.getToken = getToken;
const getTokenParent = (req) => {
    if (req.query && req.query[tokenKeyParent]) {
        return req.query[tokenKeyParent] || undefined;
    }
    else {
        return undefined;
    }
};
exports.getTokenParent = getTokenParent;
const tokenRoute = (req, _res, next) => {
    if (req.query && req.query[tokenKey]) {
        req.query[tokenKeyParent] = req.query[tokenKey] || '';
    }
    if (!('query' in req) || !req.query) {
        req.query = {};
    }
    req.query[tokenKey] = exports.uuid();
    next();
};
exports.tokenRoute = tokenRoute;
exports.logRoute = express.logger({
    transports: [transport],
    baseMeta: {
        type: 'express',
    },
    dynamicMeta: req => {
        var _a, _b;
        const meta = {
            expressOrigin: undefined,
            expressRoute: req.url || undefined,
            expressMethod: req.method || undefined,
            expressQuery: req.query || undefined,
            token: req.query && req.query[tokenKey]
                ? (_a = req.query[tokenKey]) === null || _a === void 0 ? void 0 : _a.toString() : undefined,
            tokenParent: req.query && req.query[tokenKeyParent]
                ? (_b = req.query[tokenKeyParent]) === null || _b === void 0 ? void 0 : _b.toString() : undefined,
        };
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
    },
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
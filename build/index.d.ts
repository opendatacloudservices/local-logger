/// <reference types="qs" />
import { Response } from 'express';
export declare const tokenKey = "log___token";
export declare const tokenKeyParent = "log___tokenParent";
export declare const token: (id?: string | undefined) => {
    [tokenKey]: string;
};
export declare const tokenUrl: (id?: string | undefined) => string;
export declare const addToken: (url: string, id?: string | undefined) => string;
export declare const getToken: (req: {
    query: {
        [tokenKey]?: string;
    };
}) => string;
export declare const getTokenParent: (req: {
    query: {
        [tokenKeyParent]?: string;
    };
}) => string | undefined;
export declare const tokenRoute: (req: {
    query?: {
        [tokenKey]?: string;
        [tokenKeyParent]?: string;
    };
}, res: Response, next: Function) => void;
export declare const logRoute: import("express").Handler;
export declare const logRouteError: import("express").ErrorRequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs>;
export declare const logInfo: (message: {}) => void;
export declare const logError: (message: {}) => void;
export declare const startSpan: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const startTransaction: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const uuid: () => string;

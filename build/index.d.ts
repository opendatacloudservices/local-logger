/// <reference types="qs" />
import { Request, Response } from 'express';
export declare const tokenKey = "log___token";
export declare const tokenKeyParent = "log___tokenParent";
export declare const localTokens: (res: Response) => {
    [tokenKey]?: string;
    [tokenKeyParent]?: string;
};
export declare const tokenUrl: (id: string) => string;
export declare const addToken: (url: string, res: Response) => string;
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
export declare const dynamicMeta: (req: Request, res: Response) => {
    expressOrigin: string | undefined;
    expressRoute: string | undefined;
    expressMethod: string | undefined;
    expressQuery: {} | undefined;
    token: string | undefined;
    tokenParent: string | undefined;
    duration?: number | undefined;
    resultCode?: number | undefined;
    resultBody?: string | {} | undefined;
};
export declare const logRoute: import("express").Handler;
export declare const logRouteError: import("express").ErrorRequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const logInfo: (message: {}) => void;
export declare const logError: (message: {}) => void;
export interface Transaction {
    (success: boolean, message?: {}): void;
}
export declare const startSpan: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const startTransaction: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const uuid: () => string;

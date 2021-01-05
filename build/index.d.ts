/// <reference types="express" />
declare const tokenKey = "log___token";
declare const tokenKeyParent = "log___tokenParent";
export declare const token: (id?: string | undefined) => {
    [tokenKey]: string;
};
export declare const tokenUrl: (id?: string | undefined) => string;
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
}, _res: {}, next: Function) => void;
export declare const logRoute: import("express").Handler;
export declare const logInfo: (message: {}) => void;
export declare const logError: (message: {}) => void;
export declare const startSpan: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const startTransaction: (message: {}) => (success: boolean, message?: {} | undefined) => void;
export declare const uuid: () => string;
export {};

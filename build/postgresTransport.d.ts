import * as Transport from 'winston-transport';
import { Client } from 'pg';
import { tokenKey, tokenKeyParent } from './index';
export declare class PostgresTransport extends Transport {
    client: Client;
    constructor(opts: {});
    log(pInfo: {
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
    }, callback: Function | null): void;
}

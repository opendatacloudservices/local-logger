import * as Transport from 'winston-transport';
import { Client } from 'pg';
export declare class PostgresTransport extends Transport {
    client: Client;
    constructor(opts: {});
    log(info: {
        type: string;
        duration?: number;
        success?: boolean;
        stack?: string[];
        fullStack?: string[];
        token?: string;
        tokenParent?: string;
        meta: {
            expressRoute?: string;
            expressMethod?: string;
            expressQuery?: {};
            expressOrigin?: string;
            token?: string;
            tokenParent?: string;
            duration?: number;
            stack?: string;
            error?: string;
            message?: string;
        };
    } & {
        [key: string]: string | {} | string[] | boolean | number | undefined;
    }, callback: Function | null): void;
}

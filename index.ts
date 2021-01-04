import * as winston from 'winston';
import { PostgresTransport } from './transport';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    defaultMeta: { service: 'user-service' },
    transports: [
        new PostgresTransport({ custom: 'options' }),
    ],
});

const func1 = (p1, p2) => {
    return new Promise((resolve, reject) => {
        func2('a', 'b');
        resolve(null);
    });
};

const func2 = (...args: [string, string]) => {
    // const tLogID = logID || 3;
    // console.log(__filename);
    // console.log(process.argv);
    // logger.log('error', 'Important error: ', new Error('Error passed as meta'));
    // console.log(new Error('Hello World'));
    // logger.log('error', 'Message: Hello World', new Error('new Error'))
    // console.log(func2.caller);
    // console.log(tLogID);
    // console.log(args);
    // console.log((new Error()).stack)
    throw new Error(JSON.stringify(args));
};

func1(1,2)
.then(() => {
    console.log('Promise.good');
}).catch((error) => {
    console.log('root', error);
});

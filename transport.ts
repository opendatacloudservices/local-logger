import * as Transport from 'winston-transport';

export class PostgresTransport extends Transport {
  constructor(opts) {
    super(opts);
    //
    // Consume any custom options here. e.g.:
    // - Connection information for databases
    // - Authentication information for APIs (e.g. loggly, papertrail, 
    //   logentries, etc.).
    //
    console.log('PostgresTransport', opts);
  }

  log(info, callback) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    console.log(info);

    callback();
  }
};
const dotenv = require('dotenv');
const {
  logRoute,
  logRouteError,
  logError,
  logInfo,
  startSpan,
  uuid,
  token,
  tokenRoute,
  tokenUrl,
  addToken,
  tokenKey,
} = require('../build/index');
const fetch = require('node-fetch');
const express = require('express');
const Client = require('pg').Client;

// get environmental variables
dotenv.config();

const client = new Client({
  user: process.env.LOGGER_PGUSER,
  host: process.env.LOGGER_PGHOST,
  database: process.env.LOGGER_PGDATABASE,
  password: process.env.LOGGER_PGPASSWORD,
  port: parseInt(process.env.LOGGER_PGPORT || '5432'),
});
client.connect();

test('uuid', async() => {
  const id1 = uuid();
  const id2 = uuid();
  expect(id1.length).toBe(36);
  expect(typeof id1).toBe('string');
  expect(id1 === id2).toBe(false);
});

test('logInfo', async() => {
  await new Promise((resolve, reject) => {
    const id = uuid();
    const message = 'Test Message';
    logInfo({ message, id, token: id, tokenParent: id });
    setTimeout(() => {
      client.query(`SELECT message, type, token, token_parent FROM "Logs" WHERE message ->> 'id' = $1`, [id])
        .then((result) => {
          expect(result).toHaveProperty('rows');
          expect(result.rows.length).toBeGreaterThan(0);
          expect(typeof result.rows[0].message).toBe('object');
          expect(result.rows[0].message.message).toBe(message);
          expect(result.rows[0].message.id).toBe(id);
          expect(result.rows[0].type).toBe('info');
          expect(result.rows[0].token).toBe(id);
          expect(result.rows[0].token_parent).toBe(id);
          resolve();
        }).catch((err) => {
          reject(err);
        });
    }, 1000);
  });
});

test('logError', async() => {
  await new Promise((resolve, reject) => {
    const id = uuid();
    const message = 'Test Message';
    logError({ message, id });
    setTimeout(() => {
      client.query(`SELECT message, type FROM "Logs" WHERE message ->> 'id' = $1`, [id])
        .then((result) => {
          expect(result).toHaveProperty('rows');
          expect(result.rows.length).toBeGreaterThan(0);
          expect(typeof result.rows[0].message).toBe('object');
          expect(result.rows[0].message.message).toBe(message);
          expect(result.rows[0].message.id).toBe(id);
          expect(result.rows[0].type).toBe('error');
          resolve();
        }).catch((err) => {
          reject(err);
        });
    }, 1000);
  });
});

test('logRoute, logRouteResult and tokenRoute', async() => {

  await new Promise((resolve, reject) => {
    const id = uuid();
    const parentId = uuid();
    const app = express();
    const port = process.env.PORT || 3000;
    const timeout = 2000;
    app.use(tokenRoute);
    app.use(logRoute);
  
    app.get('/ping', (req, res, next) => {
      expect(typeof req.query).toBe('object');
      expect(typeof req.query.log___token).toBe('string');
      expect(typeof req.query.log___tokenParent).toBe('string');
      expect(req.query.log___token.length).toBe(36);
      expect(req.query.log___tokenParent.length).toBe(36);
      setTimeout(() => {
        res.status(200).json({message: 'pong'});
      }, timeout);
    });

    const server = app.listen(port, () => {
      fetch('http://localhost:' + port + '/ping?id=' + id + '&' + tokenUrl(parentId))
        .then((req) => {
          server.close(() => {
            setTimeout(() => {
              client.query(`SELECT * FROM "Logs" WHERE express_query ->> 'id' = $1`, [id])
                .then((result) => {
                  expect(result).toHaveProperty('rows');
                  expect(result.rows.length).toBeGreaterThan(0);
                  expect(result.rows[0].transaction_duration).toBeGreaterThanOrEqual(timeout);
                  expect(typeof result.rows[0].express_query).toBe('object');
                  expect(result.rows[0].express_query.id).toBe(id);
                  expect(result.rows[0].type).toBe('express-logRoute');
                  expect(result.rows[0].token_parent).toBe(parentId);
                  expect(result.rows[0].token.length).toBe(36);
                  resolve();
                }).catch((err) => {
                  reject(err);
                });
              }, 1000);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  });

});

test('logErrorRoute', async() => {

  await new Promise((resolve, reject) => {
    const id = uuid();
    const parentId = uuid();
    const app = express();
    const port = process.env.PORT || 3000;
    const errorMessage = 'This is an error and it should be logged to the console';
    app.use(tokenRoute);
    app.use(logRoute);
  
    app.get('/ping', (req, res, next) => {
      expect(typeof req.query).toBe('object');
      expect(typeof req.query.log___token).toBe('string');
      expect(typeof req.query.log___tokenParent).toBe('string');
      expect(req.query.log___token.length).toBe(36);
      expect(req.query.log___tokenParent.length).toBe(36);
      return next(new Error(errorMessage));
    });

    app.use(logRouteError);
  
    const server = app.listen(port, () => {
      fetch('http://localhost:' + port + '/ping?id=' + id + '&' + tokenUrl(parentId))
        .then((req) => {
          server.close(() => {
            setTimeout(() => {
              client.query(`SELECT * FROM "Logs" WHERE express_query ->> 'id' = $1`, [id])
                .then((result) => {
                  expect(result).toHaveProperty('rows');
                  expect(result.rows.length).toBeGreaterThan(0);
                  expect(typeof result.rows[0].express_query).toBe('object');
                  expect(result.rows[0].express_query.id).toBe(id);
                  expect(result.rows[0].type).toBe('express-logRouteError');
                  expect(result.rows[0].full_stack[0]).toBe('Error: ' + errorMessage);
                  expect(result.rows[0].token_parent).toBe(parentId);
                  expect(result.rows[0].token.length).toBe(36);
                  resolve();
                }).catch((err) => {
                  reject(err);
                });
              }, 1000);
          });
        })
        .catch((err) => {
          reject(err);
        });
    });
  });

});

test('Transaction', async() => {
  const id = uuid();
  const message = 'Test Message';
  const delay = 1000;
  await new Promise((resolve, reject) => {
    const span = startSpan({ message, id });
    setTimeout(() => {
      span(true);
      setTimeout(() => {
        client.query(`SELECT message, type, transaction_success, transaction_duration FROM "Logs" WHERE message ->> 'id' = $1`, [id])
          .then((result) => {
            expect(result).toHaveProperty('rows');
            expect(result.rows.length).toBeGreaterThan(0);
            expect(typeof result.rows[0].message).toBe('object');
            expect(result.rows[0].message.message).toBe(message);
            expect(result.rows[0].message.id).toBe(id);
            expect(result.rows[0].type).toBe('transaction');
            expect(result.rows[0].transaction_success).toBe(true);
            expect(parseInt(result.rows[0].transaction_duration)).toBeGreaterThanOrEqual(delay);
            resolve();
          }).catch((err) => {
            reject(err);
          });
      }, 1000);
    }, delay);
  });
});

test('token', async() => {
  const t1 = token();
  expect(typeof t1).toBe('object');
  expect(t1).toHaveProperty('log___token');
  expect(t1.log___token.length).toBe(36);
  expect(typeof t1.log___token).toBe('string');
});

test('addToken', async() => {
  const url1 = 'https://www.test.org'
  const url2 = 'https://www.test.org?id=5'
  const t = uuid();
  const tokenUrl1 = addToken(url1, t);
  const tokenUrl2 = addToken(url2, t);
  expect(tokenUrl1).toBe(url1 + '?' + tokenKey + '=' + t)  ;
  expect(tokenUrl2).toBe(url2 + '&' + tokenKey + '=' + t)  ;
});

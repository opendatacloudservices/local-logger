const dotenv = require('dotenv');
const {logRoute, logError, logInfo, startSpan, uuid, token, tokenRoute, tokenUrl} = require('../build/index');
const fetch = require('node-fetch');
const express = require('express');
const Client = require('pg').Client;

// get environmental variables
dotenv.config();

const client = new Client({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: parseInt(process.env.PGPORT || '5432'),
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
      client.query(`SELECT message, type, token, token_parent FROM logs WHERE message ->> 'id' = $1`, [id])
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
      client.query(`SELECT message, type FROM logs WHERE message ->> 'id' = $1`, [id])
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

test('logRoute and tokenRoute', async() => {

  await new Promise((resolve, reject) => {
    const id = uuid();
    const parentId = uuid();
    const app = express();
    const port = process.env.PORT || 3000;
    app.use(tokenRoute);
    app.use(logRoute);
  
    app.get('/ping', (req, res) => {
      expect(typeof req.query).toBe('object');
      expect(typeof req.query.log___token).toBe('string');
      expect(typeof req.query.log___tokenParent).toBe('string');
      expect(req.query.log___token.length).toBe(36);
      expect(req.query.log___tokenParent.length).toBe(36);
      res.status(200).json({message: 'pong'});
    });
  
    const server = app.listen(port, () => {
      fetch('http://localhost:' + port + '/ping?id=' + id + '&' + tokenUrl(parentId))
        .then((req) => {
          server.close(() => {
            setTimeout(() => {
              client.query(`SELECT * FROM logs WHERE express_query ->> 'id' = $1`, [id])
                .then((result) => {
                  expect(result).toHaveProperty('rows');
                  expect(result.rows.length).toBeGreaterThan(0);
                  expect(typeof result.rows[0].express_query).toBe('object');
                  expect(result.rows[0].express_query.id).toBe(id);
                  expect(result.rows[0].type).toBe('express');
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
        client.query(`SELECT message, type, transaction_success, transaction_duration FROM logs WHERE message ->> 'id' = $1`, [id])
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

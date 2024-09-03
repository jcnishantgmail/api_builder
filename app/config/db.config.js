'use strict';
const dotenv = require('dotenv');
const assert = require('assert');

dotenv.config();

const { PORT, DB_PORT, HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

assert(PORT, 'PORT is required');
assert(HOST, 'HOST is required');
module.exports = {
  url: `mongodb://${DB_USER}:${DB_PASSWORD}@${HOST}:${DB_PORT}/${DB_NAME}`,
};
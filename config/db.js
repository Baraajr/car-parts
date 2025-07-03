const mongoose = require('mongoose');
require('dotenv').config();

const {
  USE_LOCAL_DB,
  USE_SERVICE_DB,
  USE_ATLAS_DB,
  DATABASE_LOCAL,
  DATABASE_SERVICE,
  DATABASE_ATLAS,
} = process.env;

let dbUri = '';

if (USE_LOCAL_DB === 'true') dbUri = DATABASE_LOCAL;
else if (USE_SERVICE_DB === 'true') dbUri = DATABASE_SERVICE;
else if (USE_ATLAS_DB === 'true') dbUri = DATABASE_ATLAS;
else throw new Error('No database config selected!');

const connectDb = () =>
  mongoose
    .connect(dbUri)
    .then((conn) =>
      console.log(
        `database connected successfully on host: ${conn.connection.host}`,
      ),
    );

module.exports = connectDb;

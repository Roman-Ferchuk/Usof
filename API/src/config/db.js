const mysql = require('mysql2');
const config = require('./config.json');

const pool = mysql.createPool({
    host: process.env.DB_HOST || config.host,
    port: Number(process.env.DB_PORT) || config.port,
    user: process.env.DB_USER || config.user,
    password: process.env.DB_PASSWORD || config.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: true
});

module.exports = pool;

const fs = require('fs');
const path = require('path');

async function initDb(pool) {
    try {
        const sqlPath = path.join(__dirname, '../database/schema.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        // pool is created with multipleStatements: true -> the whole script
        // is executed on a single connection
        await pool.query(sqlScript);

        console.log('Database schema initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database schema:', error);
        throw error;
    }
}

module.exports = initDb;

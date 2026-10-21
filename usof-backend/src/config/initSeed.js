const fs = require('fs');
const path = require('path');

async function initSeed(pool) {
    try {
        const sqlPath = path.join(__dirname, '../database/seed.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        const queries = sqlScript
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        for (const query of queries) {
            await pool.query(query);
        }
        
        console.log('Database seed initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database seed:', error);
        throw error;
    }
}

module.exports = initSeed;
const fs = require('fs');
const path = require('path');

async function initSeed(pool) {
    try {
        const [[{ total }]] = await pool.query(
            'SELECT COUNT(*) AS total FROM usof_database.users'
        );

        if (total > 0) {
            console.log('Database already contains data, seed skipped');
            return;
        }

        const sqlPath = path.join(__dirname, '../database/seed.sql');
        const sqlScript = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sqlScript);

        console.log('Database seed initialized successfully');
    } catch (error) {
        console.error('Failed to initialize database seed:', error);
        throw error;
    }
}

module.exports = initSeed;

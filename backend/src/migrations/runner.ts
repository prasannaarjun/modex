import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const runMigrations = async () => {
    const client = await pool.connect();
    try {
        console.log('Running migrations...');
        // Use process.cwd() to look in src/migrations/sql instead of dist/...
        const sqlDir = path.join(process.cwd(), 'src', 'migrations', 'sql');
        const migrationFiles = fs.readdirSync(sqlDir).sort();

        // Ensure migrations table exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        const { rows: executedMigrations } = await client.query('SELECT name FROM migrations');
        const executedNames = new Set(executedMigrations.map(r => r.name));

        for (const file of migrationFiles) {
            if (!executedNames.has(file) && file.endsWith('.sql')) {
                console.log(`Executing ${file}...`);
                const sql = fs.readFileSync(path.join(sqlDir, file), 'utf8');
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('INSERT INTO migrations (name) VALUES ($1)', [file]);
                await client.query('COMMIT');
                console.log(`Executed ${file}`);
            }
        }
        console.log('Migrations complete.');
    } catch (err) {
        console.error('Migration failed', err);
        await client.query('ROLLBACK');
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

runMigrations();

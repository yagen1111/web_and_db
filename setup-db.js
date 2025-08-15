const mysql = require('mysql2/promise');
require('dotenv').config();

async function setupDatabase() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.TIDB_HOST,
            port: process.env.TIDB_PORT || 4000,
            user: process.env.TIDB_USER,
            password: process.env.TIDB_PASSWORD,
            database: process.env.TIDB_DATABASE,
            ssl: { rejectUnauthorized: false }
        });
        
        console.log("Connected to TiDB successfully");
        console.log(`📍 Region: ${process.env.TIDB_REGION || 'unknown'}`);
        
        // Create users table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id int NOT NULL AUTO_INCREMENT,
                username varchar(50) UNIQUE NOT NULL,
                password varchar(255) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        `);
        console.log("✓ Users table created");
        
        // Create user_data table
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_data (
                id int NOT NULL AUTO_INCREMENT,
                field1 varchar(255) NOT NULL,
                field2 varchar(255) NOT NULL,
                field3 varchar(255) NOT NULL,
                created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id)
            )
        `);
        console.log("✓ User_data table created");
        
        // Insert sample data
        await connection.execute(`
            INSERT IGNORE INTO user_data (field1, field2, field3) VALUES
            ('Example 1', 'Sample value', 'Test'),
            ('Example 2', 'Additional value', 'Sample text')
        `);
        console.log("✓ Sample data inserted");
        
        await connection.end();
        console.log("Database setup complete!");
        
    } catch (error) {
        console.error("Database setup failed:", error.message);
    }
}

setupDatabase();
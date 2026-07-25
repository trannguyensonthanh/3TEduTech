require('dotenv').config();
const { sql, getConnection } = require('./src/database/connection');

async function createTable() {
    try {
        const pool = await getConnection();
        await pool.request().query(`
            IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FAQs' and xtype='U')
            BEGIN
                CREATE TABLE FAQs (
                    FaqID INT IDENTITY(1,1) PRIMARY KEY,
                    Question NVARCHAR(MAX) NOT NULL,
                    Answer NVARCHAR(MAX) NOT NULL,
                    IsActive BIT DEFAULT 1,
                    SortOrder INT DEFAULT 0,
                    CreatedAt DATETIME DEFAULT GETDATE(),
                    UpdatedAt DATETIME DEFAULT GETDATE()
                );
                PRINT 'FAQ table created successfully'
            END
            ELSE
            BEGIN
                PRINT 'FAQ table already exists'
            END
        `);
        console.log("Script executed.");
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
createTable();

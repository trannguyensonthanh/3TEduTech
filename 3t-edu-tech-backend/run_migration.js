const { getConnection, sql } = require('./src/database/connection');

async function runMigration() {
  try {
    console.log('Connecting to DB...');
    const pool = await getConnection();
    console.log('Running update query...');
    const result = await pool.request().query(`
      UPDATE lp
      SET lp.TotalTimeSpent = ISNULL(l.VideoDurationSeconds, 0)
      FROM LessonProgress lp
      JOIN Lessons l ON lp.LessonID = l.LessonID
      WHERE lp.IsCompleted = 1 
        AND l.LessonType = 'VIDEO'
        AND l.VideoDurationSeconds IS NOT NULL;
    `);
    console.log(`Updated ${result.rowsAffected} rows successfully!`);
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();

const sql = require('mssql');
const config = { 
  user: 'sa', 
  password: 'EduTech_Fallback_2026!', 
  server: '127.0.0.1', 
  database: 'ThreeTEduTechLMS', 
  options: { encrypt: true, trustServerCertificate: true }, 
  port: 1433 
}; 
sql.connect(config).then(pool => 
  pool.request().query("UPDATE lp SET lp.TotalTimeSpent = ISNULL(l.VideoDurationSeconds, 0) FROM LessonProgress lp JOIN Lessons l ON lp.LessonID = l.LessonID WHERE lp.IsCompleted = 1 AND l.LessonType = 'VIDEO' AND l.VideoDurationSeconds IS NOT NULL;")
  .then(r => { 
    console.log('Rows affected:', r.rowsAffected); 
    process.exit(0); 
  })
).catch(e => { 
  console.error(e); 
  process.exit(1); 
});

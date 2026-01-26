const sql = require('msnodesqlv8');

const connString = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=BloomHopeDB;Trusted_Connection=yes;";

async function drop() {
  sql.open(connString, (err, conn) => {
    if (err) {
      console.error(err);
      return;
    }
    const query = `
      DROP TABLE IF EXISTS health_logs;
      DROP TABLE IF EXISTS symptoms;
      DROP TABLE IF EXISTS reminders;
      DROP TABLE IF EXISTS user_profiles;
      DROP TABLE IF EXISTS users;
    `;
    conn.query(query, (err) => {
      if (err) console.error(err);
      else console.log('Tables dropped.');
      conn.close();
    });
  });
}

drop();
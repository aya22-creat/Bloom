const sql = require('msnodesqlv8');

const connString = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;";

console.log('Testing msnodesqlv8 direct...');
sql.open(connString, (err, conn) => {
  if (err) {
    console.error('Failed:', err);
  } else {
    console.log('Connected!');
    conn.close();
  }
});
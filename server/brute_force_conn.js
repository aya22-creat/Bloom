const sql = require('mssql/msnodesqlv8');

const drivers = [
  '{ODBC Driver 17 for SQL Server}',
  '{ODBC Driver 18 for SQL Server}',
  '{SQL Server Native Client 11.0}',
  '{SQL Server}'
];

const servers = [
  '.\\SQLEXPRESS',
  'localhost\\SQLEXPRESS',
  '(local)\\SQLEXPRESS',
  'AYA\\SQLEXPRESS' // Hostname
];

async function test() {
  for (const driver of drivers) {
    for (const server of servers) {
      const connString = `Driver=${driver};Server=${server};Database=master;Trusted_Connection=yes;`;
      console.log(`Trying: ${connString}`);
      try {
        await sql.connect(connString);
        console.log('SUCCESS with:', connString);
        process.exit(0);
      } catch (err) {
        console.log('Failed.'); //, err.message);
      }
    }
  }
  console.log('All failed.');
}

test();
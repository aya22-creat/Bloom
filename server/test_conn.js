const sql = require('mssql/msnodesqlv8');

const connString = "Driver={SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;";

async function test() {
  try {
    console.log('Connecting with:', connString);
    await sql.connect(connString);
    console.log('Connected!');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

test();
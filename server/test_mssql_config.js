const sql = require('mssql/msnodesqlv8');

const config = {
  server: '.',
  // instanceName: 'SQLEXPRESS', // Try this?
  database: 'master',
  options: {
    trustedConnection: true,
    instanceName: 'SQLEXPRESS' // Some drivers put it here
  }
};

// Or use connection string that worked directly
const connString = "Driver={ODBC Driver 17 for SQL Server};Server=.\\SQLEXPRESS;Database=master;Trusted_Connection=yes;";

async function test() {
  try {
    console.log('Testing mssql connect string...');
    await sql.connect(connString);
    console.log('Connected via string!');
    process.exit(0);
  } catch (err) {
    console.error('Failed string:', err.message);
  }

  try {
    console.log('Testing mssql config object...');
    await sql.connect(config);
    console.log('Connected via config!');
    process.exit(0);
  } catch (err) {
    console.error('Failed config:', err.message);
  }
}

test();
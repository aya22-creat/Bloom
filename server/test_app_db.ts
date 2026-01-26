import { Database } from './src/lib/database';

async function test() {
  try {
    console.log('Initializing Database...');
    await Database.init();
    console.log('Database initialized successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Failed:', err);
    process.exit(1);
  }
}

test();
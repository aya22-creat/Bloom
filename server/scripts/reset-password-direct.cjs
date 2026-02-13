const sqlite3 = require('sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = String(process.argv[3] || '').trim();
  if (!email || !password) {
    console.error('Usage: node scripts/reset-password-direct.cjs <email> <password>');
    process.exit(1);
  }
  const dbPath = path.join(__dirname, '..', 'data', 'bloomhope.db');
  const db = new sqlite3.Database(dbPath);
  const get = (sql, params=[]) => new Promise((resolve,reject)=>db.get(sql, params, (e,row)=> e?reject(e):resolve(row)));
  const run = (sql, params=[]) => new Promise((resolve,reject)=>db.run(sql, params, function(e){ e?reject(e):resolve({ lastID:this.lastID, changes:this.changes })}));
  const user = await get('SELECT id FROM users WHERE LOWER(email)=?', [email]);
  if (!user) { console.error('User not found'); process.exit(2); }
  const hashed = await bcrypt.hash(password, 10);
  await run('UPDATE users SET password=? WHERE id=?', [hashed, user.id]);
  console.log(JSON.stringify({ success:true, userId: user.id }));
  db.close();
}

main().catch(err=>{ console.error(err); process.exit(1); });

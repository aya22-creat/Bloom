async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = String(process.argv[3] || '').trim();
  if (!email || !password) {
    console.error('Usage: node scripts/login-test.cjs <email> <password>');
    process.exit(1);
  }
  const res = await fetch('http://localhost:4000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const text = await res.text();
  console.log(text);
}

main().catch((err) => { console.error(err); process.exitCode = 1; });

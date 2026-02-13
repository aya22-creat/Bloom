async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  const password = String(process.argv[3] || '').trim();
  if (!email || !password) {
    console.error('Usage: node scripts/reset-password-by-email.cjs <email> <password>');
    process.exit(1);
  }
  const res = await fetch('http://localhost:4000/api/dev/reset-password-by-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ status: res.status, ...data }, null, 2));
}

main().catch((err) => { console.error(err); process.exitCode = 1; });

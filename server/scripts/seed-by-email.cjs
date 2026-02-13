async function main() {
  const email = String(process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    console.error('Usage: node scripts/seed-by-email.cjs <email>');
    process.exit(1);
  }
  const res = await fetch('http://localhost:4000/api/dev/seed-by-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ status: res.status, ...data }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

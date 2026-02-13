async function main() {
  const userId = Number(process.argv[2] || 1);
  const res = await fetch('http://localhost:4000/api/dev/seed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ status: res.status, ...data }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

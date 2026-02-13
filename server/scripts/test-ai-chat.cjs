async function main() {
  const response = await fetch('http://localhost:4000/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: 'قولي نصيحة سريعة لواحدة عندها توتر',
      mode: 'health',
    }),
  });

  const data = await response.json().catch(() => ({}));
  console.log(JSON.stringify({ status: response.status, ...data }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

async function main() {
  const [to, ...bodyParts] = process.argv.slice(2);
  const body = bodyParts.join(' ').trim();

  if (!to || !body) {
    process.exitCode = 1;
    console.log('Usage: node server/scripts/test-whatsapp-simple.cjs <TO_E164> <MESSAGE>');
    console.log('Example: node server/scripts/test-whatsapp-simple.cjs +201001234567 "Hello from Bloom"');
    return;
  }

  try {
    const response = await fetch('http://localhost:4000/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, body }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      process.exitCode = 1;
    }
    console.log(JSON.stringify({ status: response.status, ...data }, null, 2));
  } catch (err) {
    process.exitCode = 1;
    console.error(err);
  }
}

main();

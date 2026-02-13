async function testRasa() {
  try {
    const response = await fetch('http://localhost:5005/webhooks/rest/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "Hello" })
    });
    
    const data = await response.json();
    console.log("Rasa Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

testRasa();

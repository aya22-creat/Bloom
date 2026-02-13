async function registerOrLogin() {
  const nonce = Date.now();
  const email = `test_chatbot_${nonce}@example.com`;
  const password = 'Test12345!';
  const username = `test_chatbot_${nonce}`;

  const registerRes = await fetch('http://localhost:4000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      email,
      password,
      userType: 'fighter',
      language: 'ar',
      phone: '01007768565',
    }),
  });

  const registerJson = await registerRes.json().catch(() => ({}));
  if (registerRes.ok && registerJson?.token) return registerJson.token;
  if (!registerRes.ok) {
    throw new Error(`Register failed: ${registerRes.status} ${JSON.stringify(registerJson)}`);
  }
  if (!registerJson?.token) {
    throw new Error(`Register did not return token: ${JSON.stringify(registerJson)}`);
  }

  const loginRes = await fetch('http://localhost:4000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json().catch(() => ({}));
  if (!loginRes.ok || !loginJson?.token) {
    throw new Error(`Login failed: ${loginRes.status} ${JSON.stringify(loginJson)}`);
  }
  return loginJson.token;
}

async function main() {
  const token = await registerOrLogin();

  const res = await fetch('http://localhost:4000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ message: 'السلام عليكم', module: 'breast_cancer' }),
  });
  const data = await res.json().catch(() => ({}));
  console.log(JSON.stringify({ status: res.status, ...data }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

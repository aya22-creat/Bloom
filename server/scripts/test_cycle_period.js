// Simple end-to-end test for Cycle Period API
// Requires backend dev server running on http://localhost:4000

const BASE = 'http://localhost:4000/api';

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return { raw: text }; }
}

async function run() {
  const userId = 1; // test user id
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 7); // start 7 days ago
  const endDate = new Date();
  endDate.setDate(endDate.getDate() - 1); // ended yesterday

  const toDateStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

  console.log('=== Cycle Period E2E Test ===');
  console.log('User:', userId);
  console.log('Start:', toDateStr(startDate), 'End:', toDateStr(endDate));

  // 1) Create cycle
  const createRes = await fetch(`${BASE}/cycles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: userId,
      start_date: toDateStr(startDate),
      cycle_length: 28,
      notes: 'E2E test'
    }),
  });
  const created = await json(createRes);
  console.log('Create status:', createRes.status, created);
  const cycleId = Number(created?.data?.id || created?.id || 0);
  if (!cycleId) throw new Error('Failed to create cycle');

  // 2) Update end_date
  const updateRes = await fetch(`${BASE}/cycles/${cycleId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ end_date: toDateStr(endDate) }),
  });
  const updated = await json(updateRes);
  console.log('Update status:', updateRes.status, updated);

  // 3) Check mandatory status for self-exam
  const statusRes = await fetch(`${BASE}/self-exams/mandatory-status/${userId}`);
  const statusJson = await json(statusRes);
  console.log('Mandatory status:', statusRes.status, statusJson);

  // 4) Verify reminder exists for next day after end
  const todayStr = toDateStr(new Date());
  const remindersRes = await fetch(`${BASE}/reminders/${userId}`);
  const reminders = await json(remindersRes);
  console.log('Reminders status:', remindersRes.status, Array.isArray(reminders) ? reminders.length : reminders?.length);
  const mandatoryCheck = (Array.isArray(reminders) ? reminders : reminders?.data || []).find(r => String(r?.type)==='checkup' && String(r?.date)===todayStr);
  console.log('Mandatory reminder for today:', Boolean(mandatoryCheck), mandatoryCheck || 'N/A');

  console.log('=== Test Completed ===');
}

run().catch(err => {
  console.error('E2E Test Failed:', err.message || err);
  process.exitCode = 1;
});


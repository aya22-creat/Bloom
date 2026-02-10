import { Database } from './database';
import { markReminderWhatsAppAttempt, sendWhatsAppText } from '../services/whatsapp.service';

const toDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function initializeReminderScheduler() {
  console.log('⏰ Reminder Scheduler Initialized');
  
  // Check every hour (to be safe and efficient)
  const INTERVAL = 60 * 60 * 1000; 
  setInterval(runChecks, INTERVAL);
  
  // Run once on startup after 10 seconds
  setTimeout(runChecks, 10000);

  const DISPATCH_INTERVAL = 60 * 1000;
  setInterval(dispatchDueReminders, DISPATCH_INTERVAL);
  setTimeout(dispatchDueReminders, 5000);
}

async function runChecks() {
  try {
    console.log('🔍 Scheduler: Checking for health reminders...');
    await checkHormonalMedications();
    await checkGeneralMedications();
    await checkSelfExams();
    await checkHormoneTests();
    await checkWaterIntake();
    await ensureMandatorySelfExamResends();
    await checkBahyaAnnualScreening();
  } catch (error) {
    console.error('❌ Scheduler Error:', error);
  }
}

async function checkBahyaAnnualScreening() {
  const phone = String(process.env.BAHYA_PHONE_NUMBER || '').trim();
  const profiles = await new Promise<any[]>((resolve) => {
    Database.db.all(
      `SELECT user_id, date_of_birth, gender FROM user_profiles WHERE date_of_birth IS NOT NULL`,
      [],
      (err, rows) => resolve(err || !rows ? [] : rows)
    );
  });

  if (profiles.length === 0) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  for (const p of profiles) {
    const userId = Number(p.user_id);
    if (!userId) continue;
    const gender = String(p.gender || '').toLowerCase();
    if (gender && gender !== 'female' && gender !== 'f' && gender !== 'أنثى' && gender !== 'انثى') continue;

    const dob = new Date(String(p.date_of_birth));
    if (Number.isNaN(dob.getTime())) continue;

    const age = Math.floor((today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    if (age < 25) continue;

    const scheduled = new Date(today.getTime());
    scheduled.setMonth(dob.getMonth());
    scheduled.setDate(dob.getDate());
    if (toDateStr(scheduled) !== todayStr) continue;

    const exists = await new Promise<boolean>((resolve) => {
      Database.db.get(
        `SELECT id FROM reminders WHERE user_id = ? AND type = 'appointment' AND date = ? AND title = ?`,
        [userId, todayStr, '🎗️ Bahya Annual Screening'],
        (err, row) => resolve(!err && Boolean((row as any)?.id))
      );
    });
    if (exists) continue;

    const time = '09:00';
    const title = '🎗️ Bahya Annual Screening';
    const desc = phone
      ? `Annual screening reminder (Bahya). Booking WhatsApp: ${phone}`
      : `Annual screening reminder (Bahya).`;

    Database.db.run(
      `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, mandatory)
       VALUES (?, ?, ?, 'appointment', ?, ?, 1, 0)`,
      [userId, title, desc, time, todayStr],
      () => {}
    );
  }
}

async function ensureMandatorySelfExamResends() {
  const allCycles = await new Promise<any[]>((resolve) => {
    Database.db.all(
      `SELECT c.user_id, c.end_date FROM cycles c WHERE c.end_date IS NOT NULL`,
      [],
      (err, rows) => resolve(err || !rows ? [] : rows)
    );
  });

  if (allCycles.length === 0) return;

  const latestEndByUser = new Map<number, string>();
  for (const r of allCycles) {
    const userId = Number(r.user_id);
    const endDate = String(r.end_date || '');
    if (!userId || !endDate) continue;
    const prev = latestEndByUser.get(userId);
    if (!prev || endDate > prev) latestEndByUser.set(userId, endDate);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = toDateStr(today);

  for (const [userId, endStr] of latestEndByUser.entries()) {
    const end = new Date(endStr);
    if (Number.isNaN(end.getTime())) continue;
    const requiredFrom = new Date(end.getTime());
    requiredFrom.setDate(requiredFrom.getDate() + 1);
    requiredFrom.setHours(0, 0, 0, 0);
    const requiredFromStr = toDateStr(requiredFrom);
    if (today.getTime() < requiredFrom.getTime()) continue;

    const completed = await new Promise<boolean>((resolve) => {
      Database.db.get(
        `SELECT id FROM self_exams WHERE user_id = ? AND exam_date >= ?`,
        [userId, requiredFromStr],
        (err, row) => resolve(!err && Boolean((row as any)?.id))
      );
    });
    if (completed) continue;

    const times = ['10:00', '18:00'];
    for (const time of times) {
      const exists = await new Promise<boolean>((resolve) => {
        Database.db.get(
          `SELECT id FROM reminders WHERE user_id = ? AND type = 'checkup' AND date = ? AND time = ? AND mandatory = 1`,
          [userId, todayStr, time],
          (err, row) => resolve(!err && Boolean((row as any)?.id))
        );
      });
      if (exists) continue;

      const title = '🩺 Self Breast Exam (Mandatory)';
      const desc = 'Reminder: Please perform your self-breast examination today.';
      Database.db.run(
        `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, mandatory)
         VALUES (?, ?, ?, 'checkup', ?, ?, 1, 1)`,
        [userId, title, desc, time, todayStr],
        () => {}
      );
    }
  }
}

async function dispatchDueReminders() {
  try {
    const now = new Date();
    const nowMs = now.getTime();

    const query = `
      SELECT r.id, r.user_id, r.type, r.title, r.description, r.time, r.date,
             r.enabled, r.whatsapp_sent, r.whatsapp_attempts, r.whatsapp_last_attempt_at,
             u.phone, u.language
      FROM reminders r
      JOIN users u ON u.id = r.user_id
      WHERE r.enabled = 1
        AND (r.whatsapp_sent IS NULL OR r.whatsapp_sent = 0)
        AND r.time IS NOT NULL
        AND r.date IS NOT NULL
        AND u.phone IS NOT NULL
    `;

    Database.db.all(query, [], async (err, rows: any[]) => {
      if (err || !rows || rows.length === 0) return;

      for (const r of rows) {
        const dateStr = String(r.date || '').trim();
        const timeStr = String(r.time || '').trim();
        if (!dateStr || !timeStr) continue;

        const due = new Date(`${dateStr}T${timeStr}:00`);
        if (Number.isNaN(due.getTime())) continue;

        const dueMs = due.getTime();
        const isDueNow = dueMs <= nowMs && dueMs >= nowMs - 60 * 60 * 1000;
        if (!isDueNow) continue;

        const lastAttempt = r.whatsapp_last_attempt_at ? new Date(String(r.whatsapp_last_attempt_at)) : null;
        if (lastAttempt && nowMs - lastAttempt.getTime() < 10 * 60 * 1000) continue;
        if (Number(r.whatsapp_attempts || 0) >= 5) continue;

        const to = String(r.phone).trim();
        const body = String(r.description || r.title || 'Reminder');

        const result = await sendWhatsAppText({
          to,
          body,
          userId: Number(r.user_id),
          reminderId: Number(r.id),
        });

        await markReminderWhatsAppAttempt({
          reminderId: Number(r.id),
          success: result.ok,
          error: result.ok ? null : result.error,
        });
      }
    });
  } catch (error) {
    console.error('Error in dispatchDueReminders:', error);
  }
}

// 1. HORMONAL MEDICATION REMINDERS
async function checkHormonalMedications() {
  try {
    const query = `
      SELECT m.*, u.username 
      FROM medications m
      JOIN users u ON m.user_id = u.id
      WHERE (m.name LIKE '%Tamoxifen%' OR m.name LIKE '%Arimidex%' OR m.name LIKE '%Letrozole%' OR m.name LIKE '%Hormon%')
      AND (m.end_date IS NULL OR m.end_date >= GETDATE())
    `;

    Database.db.all(query, [], async (err, meds) => {
      if (err) return;
      if (!meds || meds.length === 0) return;

      const today = toDateStr(new Date());

      for (const med of meds) {
        const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND title LIKE ? AND date LIKE ?`;
        const titlePattern = `%${med.name}%`;
        const datePattern = `${today}%`;

        await new Promise<void>((resolve) => {
          Database.db.all(checkQuery, [med.user_id, titlePattern, datePattern], (err, rows) => {
            if (!rows || rows.length === 0) {
              const reminderTime = "09:00";
              const warningTime = "07:00"; 

              const warningTitle = `⚠️ Pre-Medication Warning: ${med.name}`;
              const warningDesc = `Please stop taking any other medications/supplements now (2 hours before ${med.name}) to ensure efficacy.`;
              
              const insertWarning = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'appointment', ?, ?, 1)`;
              Database.db.run(insertWarning, [med.user_id, warningTitle, warningDesc, warningTime, today], () => {});

              const doseTitle = `💊 Medication Time: ${med.name}`;
              const doseDesc = `It's time for your hormonal therapy. Remember not to eat/take other meds for 2 hours after.`;
              
              const insertDose = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'appointment', ?, ?, 1)`;
              Database.db.run(insertDose, [med.user_id, doseTitle, doseDesc, reminderTime, today], () => {});
            }
            resolve();
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in checkHormonalMedications:', error);
  }
}

// 1.5. GENERAL MEDICATION REMINDERS
async function checkGeneralMedications() {
  try {
    // Select all medications that are NOT hormonal (to avoid duplicates with above)
    // or just select all and let the user manage?
    // Let's select ones that don't match the hormonal patterns to be safe.
    const query = `
      SELECT m.*
      FROM medications m
      WHERE (m.name NOT LIKE '%Tamoxifen%' AND m.name NOT LIKE '%Arimidex%' AND m.name NOT LIKE '%Letrozole%' AND m.name NOT LIKE '%Hormon%')
      AND (m.end_date IS NULL OR m.end_date >= date('now'))
    `;

    Database.db.all(query, [], async (err, meds) => {
      if (err) return;
      if (!meds || meds.length === 0) return;

      const today = toDateStr(new Date());

      for (const med of meds) {
        const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND title = ? AND date = ?`;
        const title = `💊 Medication: ${med.name}`;

        await new Promise<void>((resolve) => {
          Database.db.all(checkQuery, [med.user_id, title, today], (err, rows) => {
            if (!rows || rows.length === 0) {
              // Default times based on frequency text (simple heuristic)
              const freq = (med.frequency || '').toLowerCase();
              let times = ['09:00'];
              if (freq.includes('twice') || freq.includes('2')) times = ['09:00', '21:00'];
              if (freq.includes('thrice') || freq.includes('3')) times = ['09:00', '15:00', '21:00'];
              
              const desc = `Time to take your medication: ${med.name}. Dosage: ${med.dosage || 'As prescribed'}.`;
              
              const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'appointment', ?, ?, 1)`;
              
              times.forEach(time => {
                 Database.db.run(insert, [med.user_id, title, desc, time, today], () => {});
              });
              console.log(`✅ Created general medication reminder for user ${med.user_id}: ${med.name}`);
            }
            resolve();
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in checkGeneralMedications:', error);
  }
}

// 2. SELF-EXAM REMINDERS (Post-Period)
async function checkSelfExams() {
  try {
    const query = `
      SELECT c.* 
      FROM cycles c
      INNER JOIN (
          SELECT user_id, MAX(start_date) as max_date
          FROM cycles
          GROUP BY user_id
      ) latest ON c.user_id = latest.user_id AND c.start_date = latest.max_date
      WHERE c.end_date IS NOT NULL
    `;

    Database.db.all(query, [], async (err, cycles) => {
      if (err) return;
      if (!cycles || cycles.length === 0) return;

      const today = new Date();
      today.setHours(0,0,0,0);

      for (const cycle of cycles) {
        const endDate = new Date(cycle.end_date);
        endDate.setHours(0,0,0,0);
        const targetDate = new Date(endDate);
        targetDate.setDate(targetDate.getDate() + 1);

        if (today.getTime() === targetDate.getTime()) {
          const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND type = 'checkup' AND date = ? AND mandatory = 1`;
          const todayStr = toDateStr(today);

          await new Promise<void>((resolve) => {
            Database.db.all(checkQuery, [cycle.user_id, todayStr], (err, rows) => {
              if (!rows || rows.length === 0) {
                const title = '🩺 Self Breast Exam (Mandatory)';
                const desc = 'Reminder: Please perform your self-breast examination today.';
                const time = '10:00';
                const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, mandatory) VALUES (?, ?, ?, 'checkup', ?, ?, 1, 1)`;
                Database.db.run(insert, [cycle.user_id, title, desc, time, todayStr], () => {});
              }
              resolve();
            });
          });
        }
      }
    });

    // Fallback: if user did not mark end_date, schedule a recommended self-exam on Day 6 from start_date
    const queryNoEnd = `
      SELECT c.* 
      FROM cycles c
      INNER JOIN (
          SELECT user_id, MAX(start_date) as max_date
          FROM cycles
          GROUP BY user_id
      ) latest ON c.user_id = latest.user_id AND c.start_date = latest.max_date
      WHERE c.end_date IS NULL
    `;

    Database.db.all(queryNoEnd, [], async (err2, cycles2) => {
      if (err2 || !cycles2 || cycles2.length === 0) return;
      const today = new Date();
      today.setHours(0,0,0,0);
      for (const cycle of cycles2) {
        const startDate = new Date(cycle.start_date);
        startDate.setHours(0,0,0,0);
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + 5); // Day 6 of cycle
        if (today.getTime() === targetDate.getTime()) {
          const todayStr = toDateStr(today);
          await new Promise<void>((resolve) => {
            Database.db.all(
              `SELECT id FROM reminders WHERE user_id = ? AND type = 'checkup' AND date = ? AND mandatory = 0`,
              [cycle.user_id, todayStr],
              (e, rows) => {
                if (!rows || rows.length === 0) {
                  const title = '🩺 Self Breast Exam (Recommended)';
                  const desc = 'Recommended self-breast exam window based on cycle start.';
                  const time = '10:00';
                  const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled, mandatory) VALUES (?, ?, ?, 'checkup', ?, ?, 1, 0)`;
                  Database.db.run(insert, [cycle.user_id, title, desc, time, todayStr], () => {});
                }
                resolve();
              }
            );
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in checkSelfExams:', error);
  }
}

// 3. HORMONE TEST REMINDERS (Day 5-7 of Cycle)
async function checkHormoneTests() {
  try {
    // Find cycles that started recently
    const query = `
      SELECT c.*, u.username
      FROM cycles c
      INNER JOIN (
          SELECT user_id, MAX(start_date) as max_date
          FROM cycles
          GROUP BY user_id
      ) latest ON c.user_id = latest.user_id AND c.start_date = latest.max_date
      JOIN users u ON c.user_id = u.id
    `;

    Database.db.all(query, [], async (err, cycles) => {
      if (err) return;
      if (!cycles || cycles.length === 0) return;

      const today = new Date();
      today.setHours(0,0,0,0);

      for (const cycle of cycles) {
        const startDate = new Date(cycle.start_date);
        startDate.setHours(0,0,0,0);
        
        // Target: Day 6 of cycle (Start + 5 days)
        const targetDate = new Date(startDate);
        targetDate.setDate(targetDate.getDate() + 5);

        if (today.getTime() === targetDate.getTime()) {
          const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND title LIKE '%Hormone Test%' AND date = ?`;
          const todayStr = toDateStr(today);

          await new Promise<void>((resolve) => {
            Database.db.all(checkQuery, [cycle.user_id, todayStr], (err, rows) => {
              if (!rows || rows.length === 0) {
                const title = '🩸 Hormone Test Reminder (Day 6)';
                const desc = 'It is day 6 of your cycle. This is the optimal window (Day 5-7) to test Estrogen and Progesterone levels if recommended by your doctor.';
                const time = '08:00';
                const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'checkup', ?, ?, 1)`;
                Database.db.run(insert, [cycle.user_id, title, desc, time, todayStr], () => {
                    console.log(`✅ Created hormone test reminder for user ${cycle.user_id}`);
                });
              }
              resolve();
            });
          });
        }
      }
    });
  } catch (error) {
    console.error('Error in checkHormoneTests:', error);
  }
}

// 4. WATER INTAKE REMINDERS
async function checkWaterIntake() {
  try {
    // We add water reminders for ALL active users for TODAY if not present
    const query = `SELECT id FROM users`;
    
    Database.db.all(query, [], async (err, users) => {
      if (err || !users) return;

      const todayStr = toDateStr(new Date());
      // Hourly reminders from 8 AM to 10 PM
      const waterTimes: string[] = [];
      for (let i = 8; i <= 22; i++) {
        waterTimes.push(`${String(i).padStart(2, '0')}:00`);
      }

      for (const user of users) {
        // Check if ANY water reminder exists for today (to avoid spamming if already set)
        const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND type = 'water' AND date = ?`;
        
        await new Promise<void>((resolve) => {
          Database.db.all(checkQuery, [user.id, todayStr], (err, rows) => {
            // If fewer than 10 reminders (assuming we want hourly, so if < 15, maybe re-add missing? 
            // But simpler logic: if 0 reminders, add all. If some exist, maybe user deleted them, so don't re-add.)
            if (!rows || rows.length === 0) {
              // Create batch reminders
              const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'water', ?, ?, 1)`;
              
              waterTimes.forEach(time => {
                Database.db.run(insert, [user.id, '💧 Hydration Time', 'Time to drink a glass of water! Open app to log it.', time, todayStr], () => {});
              });
              console.log(`✅ Created hourly water reminders for user ${user.id}`);
            }
            resolve();
          });
        });
      }
    });
  } catch (error) {
    console.error('Error in checkWaterIntake:', error);
  }
}

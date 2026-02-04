import { Database } from './database';

export function initializeReminderScheduler() {
  console.log('⏰ Reminder Scheduler Initialized');
  
  // Check every hour (to be safe and efficient)
  const INTERVAL = 60 * 60 * 1000; 
  setInterval(runChecks, INTERVAL);
  
  // Run once on startup after 10 seconds
  setTimeout(runChecks, 10000);
}

async function runChecks() {
  try {
    console.log('🔍 Scheduler: Checking for health reminders...');
    await checkHormonalMedications();
    await checkSelfExams();
    await checkHormoneTests();
    await checkWaterIntake();
  } catch (error) {
    console.error('❌ Scheduler Error:', error);
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

      const today = new Date().toISOString().split('T')[0];

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
        targetDate.setDate(targetDate.getDate() + 4);

        if (today.getTime() === targetDate.getTime()) {
          const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND title = '🌸 Monthly Self-Exam' AND date = ?`;
          const todayStr = today.toISOString().split('T')[0];

          await new Promise<void>((resolve) => {
            Database.db.all(checkQuery, [cycle.user_id, todayStr], (err, rows) => {
              if (!rows || rows.length === 0) {
                const title = '🌸 Monthly Self-Exam';
                const desc = 'Your period ended a few days ago. Now is the best time for your breast self-exam as tissues are least tender.';
                const time = '10:00';
                const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'checkup', ?, ?, 1)`;
                Database.db.run(insert, [cycle.user_id, title, desc, time, todayStr], () => {});
              }
              resolve();
            });
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
          const todayStr = today.toISOString().split('T')[0];

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

      const todayStr = new Date().toISOString().split('T')[0];
      const waterTimes = ['10:00', '14:00', '18:00', '21:00'];

      for (const user of users) {
        // Check if ANY water reminder exists for today (to avoid spamming if already set)
        const checkQuery = `SELECT id FROM reminders WHERE user_id = ? AND type = 'water' AND date = ?`;
        
        await new Promise<void>((resolve) => {
          Database.db.all(checkQuery, [user.id, todayStr], (err, rows) => {
            if (!rows || rows.length === 0) {
              // Create batch reminders
              const insert = `INSERT INTO reminders (user_id, title, description, type, time, date, enabled) VALUES (?, ?, ?, 'water', ?, ?, 1)`;
              
              waterTimes.forEach(time => {
                Database.db.run(insert, [user.id, '💧 Hydration Time', 'Time to drink a glass of water to stay hydrated!', time, todayStr], () => {});
              });
              console.log(`✅ Created water reminders for user ${user.id}`);
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

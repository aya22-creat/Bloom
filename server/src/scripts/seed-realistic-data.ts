/**
 * Seed Database with Realistic Test Data
 * - Users (patients, doctors, survivors)
 * - Chat messages (community forums)
 * - Doctor-patient conversations
 * - Health logs and journal entries
 */

import { Database } from '../lib/database';
import bcrypt from 'bcryptjs';

const REALISTIC_TEST_DATA = {
  users: [
    // Patients/Fighters
    {
      name: 'Sarah Ahmed',
      email: 'sarah.ahmed@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'fighter',
      age: 42,
      language: 'en'
    },
    {
      name: 'Fatima Hassan',
      email: 'fatima.hassan@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'fighter',
      age: 38,
      language: 'ar'
    },
    // Survivors
    {
      name: 'Mariam Ali',
      email: 'mariam.ali@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'survivor',
      age: 45,
      language: 'en'
    },
    {
      name: 'Layla Ibrahim',
      email: 'layla.ibrahim@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'survivor',
      age: 50,
      language: 'ar'
    },
    // Wellness/Preventive
    {
      name: 'Nadia Khalil',
      email: 'nadia.khalil@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'wellness',
      age: 35,
      language: 'en'
    },
    {
      name: 'Amina Saleh',
      email: 'amina.saleh@example.com',
      password: 'password123',
      role: 'patient',
      userType: 'wellness',
      age: 29,
      language: 'ar'
    },
    // Doctors
    {
      name: 'Dr. Emily Roberts',
      email: 'dr.roberts@example.com',
      password: 'doctor123',
      role: 'doctor',
      userType: null,
      age: 48,
      language: 'en'
    },
    {
      name: 'Dr. Heba Mahmoud',
      email: 'dr.mahmoud@example.com',
      password: 'doctor123',
      role: 'doctor',
      userType: null,
      age: 52,
      language: 'ar'
    },
    // Admin
    {
      name: 'Admin User',
      email: 'admin@bloomhope.com',
      password: 'admin123',
      role: 'admin',
      userType: null,
      age: null,
      language: 'en'
    }
  ],

  communityMessages: {
    fighter: [
      {
        sender: 'Sarah Ahmed',
        message: 'Just finished my third chemo session today. Feeling tired but staying strong. How is everyone doing? 💪',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Fatima Hassan',
        message: 'You\'re doing amazing Sarah! I remember how tough those days were. Take rest and be gentle with yourself. Sending you love 💗',
        timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Sarah Ahmed',
        message: 'Thank you so much Fatima! Your words mean a lot to me. How are you managing your recovery?',
        timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Fatima Hassan',
        message: 'Taking it one day at a time. Started exercising again and it feels good to move my body. Don\'t rush the process ❤️',
        timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Sarah Ahmed',
        message: 'That\'s wonderful! I can\'t wait to get to that stage. For now, just focusing on getting through treatment.',
        timestamp: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString()
      }
    ],
    survivor: [
      {
        sender: 'Mariam Ali',
        message: 'Just celebrated my 3-year cancer-free anniversary! Life is beautiful 🌸',
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Layla Ibrahim',
        message: 'Congratulations Mariam! That\'s amazing news! What helped you the most during recovery?',
        timestamp: new Date(Date.now() - 47 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Mariam Ali',
        message: 'Thank you! Honestly, this community, regular check-ups, and staying active made all the difference.',
        timestamp: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Layla Ibrahim',
        message: 'I\'m 6 months post-treatment and still adjusting. Your story gives me hope!',
        timestamp: new Date(Date.now() - 45 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Mariam Ali',
        message: 'You\'re doing great! The first year is the hardest. Be patient with yourself and celebrate small victories 💗',
        timestamp: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString()
      }
    ],
    wellness: [
      {
        sender: 'Nadia Khalil',
        message: 'Just completed my annual mammogram. Everything looks good! Remember to schedule yours ladies 🩺',
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Amina Saleh',
        message: 'Great reminder! I need to book mine soon. How was the experience?',
        timestamp: new Date(Date.now() - 71 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Nadia Khalil',
        message: 'Quick and easy! The technician was very professional and kind. Don\'t put it off!',
        timestamp: new Date(Date.now() - 70 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Amina Saleh',
        message: 'Thanks for sharing! I\'ll book mine this week. Prevention is key 🌸',
        timestamp: new Date(Date.now() - 69 * 60 * 60 * 1000).toISOString()
      },
      {
        sender: 'Nadia Khalil',
        message: 'Exactly! Also been doing monthly self-exams. The app\'s reminder feature is super helpful!',
        timestamp: new Date(Date.now() - 68 * 60 * 60 * 1000).toISOString()
      }
    ]
  },

  doctorPatientChats: [
    {
      patient: 'Sarah Ahmed',
      doctor: 'Dr. Emily Roberts',
      messages: [
        {
          sender: 'Sarah Ahmed',
          message: 'Good morning Dr. Roberts. I wanted to update you on my side effects from the last chemo session.',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Dr. Emily Roberts',
          message: 'Good morning Sarah! I\'m glad you reached out. Please tell me what you\'ve been experiencing.',
          timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Sarah Ahmed',
          message: 'I\'ve had more nausea than usual and my appetite has decreased significantly.',
          timestamp: new Date(Date.now() - 11 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Dr. Emily Roberts',
          message: 'I understand. Let\'s adjust your anti-nausea medication. I\'ll send a new prescription to your pharmacy today. Also try eating small, frequent meals.',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Sarah Ahmed',
          message: 'Thank you so much! Should I be concerned about anything else?',
          timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Dr. Emily Roberts',
          message: 'Monitor your temperature and if you develop a fever over 100.4°F, call me immediately. Otherwise, these side effects should improve in a few days.',
          timestamp: new Date(Date.now() - 9 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      patient: 'Fatima Hassan',
      doctor: 'Dr. Heba Mahmoud',
      messages: [
        {
          sender: 'Fatima Hassan',
          message: 'مساء الخير دكتورة. أريد استشارتك بخصوص برنامج التمارين الرياضية',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Dr. Heba Mahmoud',
          message: 'مساء النور فاطمة. تفضلي، أنا هنا للمساعدة',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Fatima Hassan',
          message: 'هل من الآمن أن أبدأ رياضة المشي يوميا بعد شهر من انتهاء العلاج الكيماوي؟',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString()
        },
        {
          sender: 'Dr. Heba Mahmoud',
          message: 'نعم بالتأكيد! المشي من أفضل التمارين. ابدأي بـ 10-15 دقيقة يوميا وزيدي تدريجيا. استمعي لجسمك واستريحي عند الحاجة',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ]
};

async function seedDatabase() {
  console.log('🌱 Starting database seeding with realistic data...\n');

  try {
    // 1. Create users
    console.log('👥 Creating users...');
    const userIds: { [key: string]: number } = {};

    for (const userData of REALISTIC_TEST_DATA.users) {
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      await new Promise<void>((resolve, reject) => {
        Database.db.run(
          `INSERT INTO users (username, email, password, role, user_type, age, language) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [userData.name, userData.email, hashedPassword, userData.role, userData.userType, userData.age, userData.language],
          function(err) {
            if (err) {
              if (err.message.includes('UNIQUE constraint failed')) {
                console.log(`   ⚠️  User ${userData.email} already exists, skipping...`);
                // Get existing user ID
                Database.db.get(
                  'SELECT id FROM users WHERE email = ?',
                  [userData.email],
                  (err, row: any) => {
                    if (!err && row) {
                      userIds[userData.name] = row.id;
                    }
                    resolve();
                  }
                );
              } else {
                reject(err);
              }
            } else {
              userIds[userData.name] = this.lastID;
              console.log(`   ✅ Created: ${userData.name} (${userData.email}) - ${userData.role}`);
              resolve();
            }
          }
        );
      });
    }

    // 2. Seed community messages
    console.log('\n💬 Seeding community forum messages...');
    for (const [room, messages] of Object.entries(REALISTIC_TEST_DATA.communityMessages)) {
      console.log(`   📝 Adding messages to ${room} room...`);
      for (const msg of messages) {
        await new Promise<void>((resolve, reject) => {
          Database.db.run(
            `INSERT INTO chat_messages (room, sender, content, created_at) VALUES (?, ?, ?, ?)`,
            [room, msg.sender, msg.message, msg.timestamp],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }
      console.log(`   ✅ Added ${messages.length} messages to ${room} forum`);
    }

    // 3. Create chat rooms for doctor-patient conversations
    console.log('\n🏥 Creating doctor-patient chat rooms...');
    for (const chatData of REALISTIC_TEST_DATA.doctorPatientChats) {
      const patientId = userIds[chatData.patient];
      const doctorId = userIds[chatData.doctor];

      if (!patientId || !doctorId) {
        console.log(`   ⚠️  Skipping chat: Missing user IDs`);
        continue;
      }

      // Create or get chat room
      const roomId = await new Promise<number>((resolve, reject) => {
        Database.db.run(
          `INSERT INTO chat_rooms (type, patient_id, doctor_id, created_at, updated_at) 
           VALUES ('private', ?, ?, datetime('now'), datetime('now'))`,
          [patientId, doctorId],
          function(err) {
            if (err) {
              // If room exists, get its ID
              Database.db.get(
                'SELECT id FROM chat_rooms WHERE patient_id = ? AND doctor_id = ?',
                [patientId, doctorId],
                (err, row: any) => {
                  if (!err && row) resolve(row.id);
                  else reject(err);
                }
              );
            } else {
              resolve(this.lastID);
            }
          }
        );
      });

      // Add messages to room
      for (const msg of chatData.messages) {
        const senderId = userIds[msg.sender];
        await new Promise<void>((resolve, reject) => {
          Database.db.run(
            `INSERT INTO messages (room_id, sender_id, message_content, sent_at) 
             VALUES (?, ?, ?, ?)`,
            [roomId, senderId, msg.message, msg.timestamp],
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });
      }

      console.log(`   ✅ Created chat room: ${chatData.patient} ↔ ${chatData.doctor}`);
    }

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📋 Test Accounts Summary:');
    console.log('   Patients:');
    console.log('     • sarah.ahmed@example.com (password: password123) - Fighter');
    console.log('     • fatima.hassan@example.com (password: password123) - Fighter');
    console.log('     • mariam.ali@example.com (password: password123) - Survivor');
    console.log('     • layla.ibrahim@example.com (password: password123) - Survivor');
    console.log('     • nadia.khalil@example.com (password: password123) - Wellness');
    console.log('     • amina.saleh@example.com (password: password123) - Wellness');
    console.log('   Doctors:');
    console.log('     • dr.roberts@example.com (password: doctor123)');
    console.log('     • dr.mahmoud@example.com (password: doctor123)');
    console.log('   Admin:');
    console.log('     • admin@bloomhope.com (password: admin123)');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('\n✅ Seeding script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };

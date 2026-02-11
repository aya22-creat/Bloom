import TelegramBot from 'node-telegram-bot-api';
import { Database, RunResult } from '../lib/database';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8580242639:AAGZuTEbR3RaOgboQVsNnjs511fGE6aXik8';
let bot: TelegramBot | null = null;

interface ReminderMessage {
  title: string;
  description?: string;
  dateTime: string;
  type: 'user' | 'doctor';
}

const dbGet = <T = Record<string, unknown>>(query: string, params: unknown[] = []) =>
  new Promise<T | null>((resolve, reject) => {
    Database.db.get(query, params, (err, row) => {
      if (err) return reject(err);
      resolve(row || null);
    });
  });

const dbRun = (query: string, params: unknown[] = []) =>
  new Promise<RunResult>((resolve, reject) => {
    Database.db.run(query, params, function (this: RunResult, err) {
      if (err) return reject(err);
      resolve({ lastID: this?.lastID || 0, changes: this?.changes || 0 });
    });
  });

const ensureBot = () => bot;

// Initialize bot
export function initializeTelegramBot() {
  if (!BOT_TOKEN) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN is not set. Telegram bot will not start.');
    return;
  }

  if (bot) return;

  bot = new TelegramBot(BOT_TOKEN, { polling: true });
  console.log('🤖 Telegram Bot starting...');

  // Handle /start command
  bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    console.log(`📱 /start command from chat ${chatId}`);

    await bot?.sendMessage(
      chatId,
      `👋 Welcome to Hope Bloom!\n\n` +
        `To link your account, please share your phone number below.\n\n` +
        `Once linked, you'll receive personalized reminders for:\n` +
        `✅ Medications\n` +
        `✅ Appointments\n` +
        `✅ Health check-ups\n` +
        `✅ Custom reminders\n\n` +
        `💪 Let's support your health journey together!`,
      {
        reply_markup: {
          keyboard: [[{ text: 'Share phone number', request_contact: true }]],
          resize_keyboard: true,
          one_time_keyboard: true,
        },
      }
    );
  });

  // Handle contact sharing
  bot.on('contact', async (msg) => {
    const chatId = msg.chat.id;
    const contact = msg.contact;

    if (contact?.phone_number) {
      await linkAccountByPhone(chatId, contact.phone_number);
    }
  });

  console.log('✅ Telegram Bot is running!');
}

// Link account by phone number
async function linkAccountByPhone(chatId: number, phone: string) {
  try {
    // Clean phone number (digits only)
    const cleanPhone = phone.replace(/\D/g, '');
    const last10 = cleanPhone.slice(-10);

    // Find user by phone (try with and without country code)
    const user = await dbGet<{ id: number; username: string; phone?: string }>(
      `SELECT id, username, phone
       FROM users
       WHERE REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', '') = ?
          OR REPLACE(REPLACE(REPLACE(phone, '+', ''), ' ', ''), '-', '') LIKE ?
       LIMIT 1`,
      [cleanPhone, `%${last10}`]
    );

    if (user) {
      await dbRun(
        `UPDATE users
         SET telegram_chat_id = ?, telegram_verified = 1
         WHERE id = ?`,
        [String(chatId), user.id]
      );

      await bot?.sendMessage(
        chatId,
        `✅ Account linked successfully!\n\n` +
          `👋 Hi ${user.username}!\n\n` +
          `You'll now receive reminders and updates here.\n` +
          `You can continue setting up your profile in the app.`
      );

      console.log(`✅ Linked user ${user.id} to Telegram chat ${chatId}`);
    } else {
      await bot?.sendMessage(
        chatId,
        `❌ No account found with this phone number.\n\n` +
          `Please make sure you've registered in the app first, or enter your phone number manually in profile settings.`
      );
    }
  } catch (error) {
    console.error('Error linking account:', error);
    await bot?.sendMessage(
      chatId,
      `⚠️ Something went wrong. Please try again or link manually in the app.`
    );
  }
}

// Send reminder to user
export async function sendTelegramReminder(
  userId: number,
  reminder: ReminderMessage
): Promise<boolean> {
  try {
    const activeBot = ensureBot();
    if (!activeBot) return false;

    // Get user's telegram_chat_id
    const user = await dbGet<{ telegram_chat_id?: string; username?: string }>(
      `SELECT telegram_chat_id, username
       FROM users
       WHERE id = ? AND telegram_verified = 1`,
      [userId]
    );

    if (!user || !user.telegram_chat_id) {
      console.log(`⚠️ User ${userId} has no verified Telegram`);
      return false;
    }

    const chatId = parseInt(user.telegram_chat_id, 10);

    // Format message
    const typeIcon = reminder.type === 'doctor' ? '👨‍⚕️' : '📌';
    const message =
      `${typeIcon} *Reminder*\n\n` +
      `*${reminder.title}*\n` +
      (reminder.description ? `${reminder.description}\n\n` : '\n') +
      `🕐 ${new Date(reminder.dateTime).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })}\n\n` +
      `_${reminder.type === 'doctor' ? 'Prescribed by your doctor' : 'Your personal reminder'}_`;

    await activeBot.sendMessage(chatId, message, { parse_mode: 'Markdown' });

    console.log(`✅ Sent reminder to user ${userId} (chat ${chatId})`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send reminder to user ${userId}:`, error);
    return false;
  }
}

// Manual linking (called from API)
export async function linkTelegramAccount(userId: number, chatId: string): Promise<boolean> {
  try {
    const activeBot = ensureBot();
    if (!activeBot) return false;

    await dbRun(
      `UPDATE users
       SET telegram_chat_id = ?, telegram_verified = 1
       WHERE id = ?`,
      [chatId, userId]
    );

    await activeBot.sendMessage(
      parseInt(chatId, 10),
      `✅ Your Hope Bloom account has been linked!\n\n` +
        `You'll now receive reminders here.`
    );

    return true;
  } catch (error) {
    console.error('Error linking account:', error);
    return false;
  }
}

// Check if user has linked Telegram
export async function isTelegramLinked(userId: number): Promise<boolean> {
  const user = await dbGet<{ telegram_verified?: number }>(
    `SELECT telegram_verified
     FROM users
     WHERE id = ?`,
    [userId]
  );

  return Boolean(user && user.telegram_verified === 1);
}

export default bot;

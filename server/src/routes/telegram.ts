import express from 'express';
import { linkTelegramAccount, isTelegramLinked, sendTelegramReminder } from '../services/telegram.service';
import { createReminder, getUserReminders, deleteReminder } from '../services/reminderScheduler.service';

const router = express.Router();

// Check if user has linked Telegram
router.get('/status/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const verified = await isTelegramLinked(userId);
    
    res.json({ verified });
  } catch (error) {
    console.error('Error checking Telegram status:', error);
    res.status(500).json({ error: 'Failed to check status' });
  }
});

// Manual link Telegram account
router.post('/link', async (req, res) => {
  try {
    const { userId, chatId } = req.body;
    
    if (!userId || !chatId) {
      return res.status(400).json({ error: 'userId and chatId required' });
    }

    const success = await linkTelegramAccount(parseInt(userId), chatId);
    
    if (success) {
      res.json({ success: true, message: 'Account linked successfully' });
    } else {
      res.status(500).json({ error: 'Failed to link account' });
    }
  } catch (error) {
    console.error('Error linking Telegram:', error);
    res.status(500).json({ error: 'Failed to link account' });
  }
});

// Create a new reminder
router.post('/reminders', async (req, res) => {
  try {
    const { userId, title, description, reminderDate, reminderTime, createdBy } = req.body;
    
    if (!userId || !title || !reminderDate || !reminderTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const reminderId = await createReminder({
      userId: parseInt(userId),
      title,
      description,
      reminderDate,
      reminderTime,
      createdBy: createdBy || 'user'
    });

    res.json({ 
      success: true, 
      reminderId,
      message: 'Reminder created successfully'
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ error: 'Failed to create reminder' });
  }
});

// Get user's reminders
router.get('/reminders/:userId', async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const includeCompleted = req.query.completed === 'true';
    
    const reminders = await getUserReminders(userId, includeCompleted);
    
    res.json({ reminders });
  } catch (error) {
    console.error('Error getting reminders:', error);
    res.status(500).json({ error: 'Failed to get reminders' });
  }
});

// Delete a reminder
router.delete('/reminders/:reminderId', async (req, res) => {
  try {
    const reminderId = parseInt(req.params.reminderId);
    const userId = parseInt(req.body.userId);
    
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const deleted = await deleteReminder(reminderId, userId);
    
    if (deleted) {
      res.json({ success: true, message: 'Reminder deleted' });
    } else {
      res.status(404).json({ error: 'Reminder not found' });
    }
  } catch (error) {
    console.error('Error deleting reminder:', error);
    res.status(500).json({ error: 'Failed to delete reminder' });
  }
});

// Test sending a reminder (for testing purposes)
router.post('/send-test', async (req, res) => {
  try {
    const { userId, title, description } = req.body;
    
    if (!userId || !title) {
      return res.status(400).json({ error: 'userId and title required' });
    }

    const sent = await sendTelegramReminder(parseInt(userId), {
      title,
      description,
      dateTime: new Date().toISOString(),
      type: 'user'
    });

    if (sent) {
      res.json({ success: true, message: 'Test reminder sent' });
    } else {
      res.status(500).json({ error: 'Failed to send reminder' });
    }
  } catch (error) {
    console.error('Error sending test reminder:', error);
    res.status(500).json({ error: 'Failed to send test reminder' });
  }
});

export default router;

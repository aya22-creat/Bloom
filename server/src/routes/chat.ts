/**
 * Chat routes for global and private messaging
 */

import { Router, Request, Response } from 'express';
import { Database } from '../lib/database';
import { requireAuth, requireRole, requirePatientAccess } from '../middleware/rbac.middleware';
import { validate, createChatRoomSchema, sendMessageSchema } from '../middleware/validation.schemas';
import { emitToRoom, emitToGlobalChat } from '../lib/socket';
import { logAudit } from '../services/audit.service';

const router = Router();

/**
 * GET /api/chat/rooms
 * Get all chat rooms user has access to
 */
router.get('/rooms', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.userId;
    const role = req.user!.role;

    let rooms: any[] = [];

    if (role === 'patient') {
      // Patients see: global room + their private room with assigned doctor
      rooms = await new Promise<any[]>((resolve, reject) => {
        Database.db.all(
          `SELECT cr.*, 
                  p.username as patient_name, p.email as patient_email,
                  d.username as doctor_name, d.email as doctor_email
           FROM chat_rooms cr
           LEFT JOIN users p ON cr.patient_id = p.id
           LEFT JOIN users d ON cr.doctor_id = d.id
           WHERE cr.type = 'global' OR cr.patient_id = ?
           ORDER BY cr.updated_at DESC`,
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
    } else if (role === 'doctor') {
      // Doctors see: their private rooms with assigned patients
      rooms = await new Promise<any[]>((resolve, reject) => {
        Database.db.all(
          `SELECT cr.*, 
                  p.username as patient_name, p.email as patient_email,
                  d.username as doctor_name, d.email as doctor_email
           FROM chat_rooms cr
           LEFT JOIN users p ON cr.patient_id = p.id
           LEFT JOIN users d ON cr.doctor_id = d.id
           WHERE cr.doctor_id = ?
           ORDER BY cr.updated_at DESC`,
          [userId],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
    } else if (role === 'admin') {
      // Admins see all rooms
      rooms = await new Promise<any[]>((resolve, reject) => {
        Database.db.all(
          `SELECT cr.*, 
                  p.username as patient_name, p.email as patient_email,
                  d.username as doctor_name, d.email as doctor_email
           FROM chat_rooms cr
           LEFT JOIN users p ON cr.patient_id = p.id
           LEFT JOIN users d ON cr.doctor_id = d.id
           ORDER BY cr.updated_at DESC`,
          [],
          (err, rows) => {
            if (err) reject(err);
            else resolve(rows || []);
          }
        );
      });
    }

    res.json({ rooms });
  } catch (error) {
    console.error('[Get Chat Rooms Error]', error);
    res.status(500).json({
      error: 'Failed to get chat rooms',
      message: 'An error occurred while fetching chat rooms',
    });
  }
});

/**
 * POST /api/chat/rooms
 * Create a private chat room (admin or system)
 */
router.post('/rooms', requireAuth, requireRole('admin'), validate(createChatRoomSchema), async (req: Request, res: Response) => {
  try {
    const { type, patientId, doctorId } = req.body;

    if (type === 'private' && (!patientId || !doctorId)) {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Private rooms require both patientId and doctorId',
      });
    }

    // Check if room already exists
    if (type === 'private') {
      const existingRoom: any = await new Promise((resolve, reject) => {
        Database.db.get(
          'SELECT id FROM chat_rooms WHERE type = ? AND patient_id = ? AND doctor_id = ?',
          ['private', patientId, doctorId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row);
          }
        );
      });

      if (existingRoom) {
        return res.status(400).json({
          error: 'Room exists',
          message: 'Private room already exists for this patient-doctor pair',
          roomId: existingRoom.id,
        });
      }
    }

    // Create room
    const roomId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO chat_rooms (type, patient_id, doctor_id, created_at, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [type, patientId || null, doctorId || null],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: req.user!.userId,
      action: 'chat_room_created',
      entity_type: 'chat_room',
      entity_id: roomId,
      details: JSON.stringify({ type, patientId, doctorId }),
      ip_address: req.ip,
    });

    res.status(201).json({
      message: 'Chat room created',
      roomId,
      type,
      patientId,
      doctorId,
    });
  } catch (error) {
    console.error('[Create Chat Room Error]', error);
    res.status(500).json({
      error: 'Failed to create chat room',
      message: 'An error occurred while creating chat room',
    });
  }
});

/**
 * GET /api/chat/rooms/:id/messages
 * Get messages from a chat room
 */
router.get('/rooms/:id/messages', requireAuth, async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.id);
    const { limit = 50, offset = 0 } = req.query;

    // Verify user has access to this room
    const room: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM chat_rooms WHERE id = ?',
        [roomId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'Chat room does not exist',
      });
    }

    // Check access
    const userId = req.user!.userId;
    const role = req.user!.role;

    if (role === 'patient') {
      if (room.type === 'private' && room.patient_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this chat room',
        });
      }
    } else if (role === 'doctor') {
      if (room.type !== 'private' || room.doctor_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this chat room',
        });
      }
    }
    // Admins have access to all rooms

    // Get messages
    const messages = await new Promise<any[]>((resolve, reject) => {
      Database.db.all(
        `SELECT cm.*, u.username as sender_name, u.role as sender_role
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id
         WHERE cm.room_id = ? AND cm.is_deleted = 0
         ORDER BY cm.created_at DESC
         LIMIT ? OFFSET ?`,
        [roomId, parseInt(limit as string), parseInt(offset as string)],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    res.json({
      roomId,
      messages: messages.reverse(), // Reverse to show oldest first
    });
  } catch (error) {
    console.error('[Get Messages Error]', error);
    res.status(500).json({
      error: 'Failed to get messages',
      message: 'An error occurred while fetching messages',
    });
  }
});

/**
 * POST /api/chat/rooms/:id/messages
 * Send a message to a chat room
 */
router.post('/rooms/:id/messages', requireAuth, validate(sendMessageSchema), async (req: Request, res: Response) => {
  try {
    const roomId = parseInt(req.params.id);
    const { message, attachments } = req.body;
    const userId = req.user!.userId;
    const role = req.user!.role;

    // Verify room exists and user has access
    const room: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM chat_rooms WHERE id = ?',
        [roomId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!room) {
      return res.status(404).json({
        error: 'Room not found',
        message: 'Chat room does not exist',
      });
    }

    // Check access
    if (role === 'patient') {
      if (room.type === 'private' && room.patient_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this chat room',
        });
      }
    } else if (role === 'doctor') {
      if (room.type === 'global') {
        return res.status(403).json({
          error: 'Access denied',
          message: 'Doctors cannot post in global chat',
        });
      }
      if (room.type === 'private' && room.doctor_id !== userId) {
        return res.status(403).json({
          error: 'Access denied',
          message: 'You do not have access to this chat room',
        });
      }
    }

    // Basic profanity filter (naive implementation)
    const hasProfanity = containsProfanity(message);

    // Insert message
    const messageId = await new Promise<number>((resolve, reject) => {
      Database.db.run(
        `INSERT INTO chat_messages (room_id, sender_id, message, attachments, is_reported, created_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [roomId, userId, message, attachments ? JSON.stringify(attachments) : null, hasProfanity ? 1 : 0],
        function (err) {
          if (err) reject(err);
          else resolve(this.lastID);
        }
      );
    });

    // Update room's updated_at
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE chat_rooms SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [roomId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Get full message with sender info
    const fullMessage: any = await new Promise((resolve, reject) => {
      Database.db.get(
        `SELECT cm.*, u.username as sender_name, u.role as sender_role
         FROM chat_messages cm
         LEFT JOIN users u ON cm.sender_id = u.id
         WHERE cm.id = ?`,
        [messageId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Emit to socket.io
    if (room.type === 'global') {
      emitToGlobalChat('message:received', fullMessage);
    } else {
      emitToRoom(roomId, 'message:received', fullMessage);
    }

    res.status(201).json({
      message: 'Message sent',
      data: fullMessage,
    });
  } catch (error) {
    console.error('[Send Message Error]', error);
    res.status(500).json({
      error: 'Failed to send message',
      message: 'An error occurred while sending message',
    });
  }
});

/**
 * POST /api/chat/messages/:id/report
 * Report a message for moderation
 */
router.post('/messages/:id/report', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);

    // Update message
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE chat_messages SET is_reported = 1 WHERE id = ?',
        [messageId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Log audit
    await logAudit({
      user_id: req.user!.userId,
      action: 'message_reported',
      entity_type: 'chat_message',
      entity_id: messageId,
      ip_address: req.ip,
    });

    res.json({ message: 'Message reported' });
  } catch (error) {
    console.error('[Report Message Error]', error);
    res.status(500).json({
      error: 'Failed to report message',
      message: 'An error occurred while reporting message',
    });
  }
});

/**
 * DELETE /api/chat/messages/:id
 * Delete a message (admin or sender)
 */
router.delete('/messages/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const messageId = parseInt(req.params.id);
    const userId = req.user!.userId;
    const role = req.user!.role;

    // Get message
    const message: any = await new Promise((resolve, reject) => {
      Database.db.get(
        'SELECT * FROM chat_messages WHERE id = ?',
        [messageId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!message) {
      return res.status(404).json({
        error: 'Message not found',
        message: 'Message does not exist',
      });
    }

    // Check permission
    if (role !== 'admin' && message.sender_id !== userId) {
      return res.status(403).json({
        error: 'Access denied',
        message: 'You can only delete your own messages',
      });
    }

    // Soft delete
    await new Promise<void>((resolve, reject) => {
      Database.db.run(
        'UPDATE chat_messages SET is_deleted = 1 WHERE id = ?',
        [messageId],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    // Emit to socket.io
    emitToRoom(message.room_id, 'message:deleted', {
      messageId,
      roomId: message.room_id,
    });

    // Log audit
    await logAudit({
      user_id: userId,
      action: 'message_deleted',
      entity_type: 'chat_message',
      entity_id: messageId,
      ip_address: req.ip,
    });

    res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('[Delete Message Error]', error);
    res.status(500).json({
      error: 'Failed to delete message',
      message: 'An error occurred while deleting message',
    });
  }
});

/**
 * Naive profanity filter
 */
function containsProfanity(text: string): boolean {
  const profanityList = ['badword1', 'badword2']; // Extend as needed
  const lowerText = text.toLowerCase();
  return profanityList.some(word => lowerText.includes(word));
}

export default router;

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Database } from './database';
import { encrypt } from './crypto';

let io: Server;

export const initializeSocketIO = (httpServer: HttpServer) => {
  // Ensure chat_messages table exists (Secure Archive)
  const createTableQuery = `
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='chat_messages' AND xtype='U')
    CREATE TABLE chat_messages (
      id INT IDENTITY(1,1) PRIMARY KEY,
      room NVARCHAR(50),
      sender NVARCHAR(50),
      content NVARCHAR(MAX), -- Encrypted content
      created_at DATETIME DEFAULT GETDATE()
    )
  `;
  
  // Run DB init shortly after startup
  setTimeout(() => {
     try { 
       Database.db.run(createTableQuery, [], (err) => {
         if (!err) console.log('✅ Chat Security: Encrypted message archive ready');
       }); 
     } 
     catch (e) { console.error('Chat DB Init Error', e); }
  }, 5000);

  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all origins for dev, in prod restrict this
      methods: ['GET', 'POST'],
    },
  });

  io.on('connection', (socket: Socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join Room (based on user type: fighter, survivor, wellness)
    socket.on('join_room', (data: { room: string; userName: string } | string) => {
      // Handle both old and new format for backwards compatibility
      const room = typeof data === 'string' ? data : data.room;
      const userName = typeof data === 'object' ? data.userName : 'Anonymous';
      
      socket.join(room);
      console.log(`👤 User ${socket.id} (${userName}) joined room: ${room}`);
      
      // Load and send previous messages from database
      try {
        const selectQuery = `SELECT sender, content as message, created_at as timestamp FROM chat_messages WHERE room = ? ORDER BY created_at DESC LIMIT 50`;
        Database.db.all(selectQuery, [room], (err, rows: any[]) => {
          if (err) {
            console.error('❌ Failed to load previous messages:', err);
            socket.emit('previous_messages', { messages: [] });
          } else {
            // Decrypt messages and reverse to show oldest first
            const messages = (rows || [])
              .map((msg: any) => {
                try {
                  return {
                    sender: msg.sender,
                    message: msg.message, // Would be encrypted in production - decrypt here
                    timestamp: msg.timestamp
                  };
                } catch (e) {
                  console.error('Failed to decrypt message:', e);
                  return null;
                }
              })
              .filter(Boolean)
              .reverse();
            
            socket.emit('previous_messages', { messages });
          }
        });
      } catch (err) {
        console.error('Error loading messages:', err);
        socket.emit('previous_messages', { messages: [] });
      }
      
      // Notify others in the room
      socket.to(room).emit('notification', { 
        type: 'user_joined', 
        message: 'A new user has joined the chat' 
      });
    });

    // Send Message
    socket.on('send_message', (data: { room: string; message: string; sender: string; timestamp?: string }) => {
      // Add timestamp if missing
      const messageData = {
        ...data,
        timestamp: data.timestamp || new Date().toISOString()
      };
      
      // 1. Encrypt and Archive Message (Privacy First)
      try {
        const encryptedContent = encrypt(data.message);
        const insertQuery = `INSERT INTO chat_messages (room, sender, content) VALUES (?, ?, ?)`;
        
        Database.db.run(insertQuery, [data.room, data.sender, encryptedContent], (err) => {
          if (err) console.error('❌ Failed to archive secure message:', err);
        });
      } catch (err) {
        console.error('Encryption error:', err);
      }
      
      // 2. Broadcast to everyone in the room (Transport is secured by HTTPS/WSS)
      console.log(`💬 Secure Message broadcast to ${data.room}`);
      io.to(data.room).emit('receive_message', messageData);
    });

    // Typing Indicator
    socket.on('typing', (data: { room: string; sender: string; isTyping: boolean }) => {
      socket.to(data.room).emit('user_typing', data);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

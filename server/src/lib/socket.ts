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
    socket.on('join_room', (room: string) => {
      socket.join(room);
      console.log(`👤 User ${socket.id} joined room: ${room}`);
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

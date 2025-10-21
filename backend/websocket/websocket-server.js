const { Server } = require('socket.io');
const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');

const app = express();
const server = http.createServer(app);

// Configure CORS for your frontend
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Middleware to authenticate socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    // Verify JWT token (use your Laravel app key)
    const decoded = jwt.verify(token, process.env.APP_KEY || 'your-app-key');
    socket.userId = decoded.sub || decoded.user_id;
    socket.userRole = decoded.role;
    socket.userBranchId = decoded.branch_id;
    next();
  } catch (err) {
    next(new Error('Authentication error: Invalid token'));
  }
});

// Store active connections
const activeConnections = new Map();

io.on('connection', (socket) => {
  console.log(`User ${socket.userId} connected with role ${socket.userRole}`);
  
  // Store connection info
  activeConnections.set(socket.userId, {
    socketId: socket.id,
    role: socket.userRole,
    branchId: socket.userBranchId,
    connectedAt: new Date(),
  });

  // Handle joining channels
  socket.on('join', (channel) => {
    socket.join(channel);
    console.log(`User ${socket.userId} joined channel ${channel}`);
  });

  // Handle leaving channels
  socket.on('leave', (channel) => {
    socket.leave(channel);
    console.log(`User ${socket.userId} left channel ${channel}`);
  });

  // Handle custom events
  socket.on('custom-event', (data) => {
    console.log(`Custom event from user ${socket.userId}:`, data);
    // Broadcast to appropriate channels based on data
    if (data.type === 'appointment') {
      socket.to(`branch.${data.branchId}`).emit('appointment-update', data);
    }
  });

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`User ${socket.userId} disconnected: ${reason}`);
    activeConnections.delete(socket.userId);
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error(`Socket error for user ${socket.userId}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: activeConnections.size,
    uptime: process.uptime(),
  });
});

// Get active connections info
app.get('/connections', (req, res) => {
  const connections = Array.from(activeConnections.entries()).map(([userId, info]) => ({
    userId,
    ...info,
  }));
  
  res.json({
    total: activeConnections.size,
    connections,
  });
});

const PORT = process.env.WEBSOCKET_PORT || 6001;

server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Connections info: http://localhost:${PORT}/connections`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

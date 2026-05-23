require('dotenv').config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const seedDefaultAdmin = require('./config/seedAdmin');
const { Server } = require('socket.io');
const notificationService = require('./services/notification.service');
const authenticateSocket = require('./middlewares/auth.middleware').authenticateSocket;

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
});

// Initialiser le service de notifications avec Socket.io
notificationService.setIO(io);

// Middleware Socket.io pour l'authentification
io.use((socket, next) => {
  authenticateSocket(socket, next);
});

// Gestion des connexions Socket.io
io.on('connection', (socket) => {
  console.log(`Utilisateur connecté: ${socket.userId}`);

  // Enregistrer le socket de l'utilisateur
  notificationService.registerUserSocket(socket.userId, socket.id);

  // Événement pour rejoindre une room d'utilisateur
  socket.on('join:user-room', () => {
    socket.join(`user:${socket.userId}`);
  });

  // Événement pour rejoindre une room de club
  socket.on('join:club-room', (clubId) => {
    socket.join(`club:${clubId}`);
  });

  // Événement de déconnexion
  socket.on('disconnect', () => {
    console.log(`Utilisateur déconnecté: ${socket.userId}`);
    notificationService.removeUserSocket(socket.userId, socket.id);
  });
});

async function bootstrap() {
  try {
    await connectDB(MONGODB_URI);
    await seedDefaultAdmin();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server bootstrap failed:', error.message);
    process.exit(1);
  }
}

bootstrap();


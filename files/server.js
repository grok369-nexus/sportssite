// server.js — Sports Club Backend
// Handles: JWT Auth, MongoDB Atlas, Socket.io live chat, Sports news API

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');

// ─── App & HTTP Server ────────────────────────────────────────────────────────
const app = express();
const httpServer = http.createServer(app);

// ─── Socket.io ────────────────────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Vite dev server
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// ─── MongoDB Atlas Connection ─────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sportsclub';

mongoose
  .connect(MONGO_URI)
  .then(() => console.log('✅  MongoDB Atlas connected'))
  .catch((err) => console.error('❌  MongoDB connection error:', err.message));

// ─── Mongoose Schemas ─────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  avatar:   { type: String, default: '' },
  createdAt:{ type: Date, default: Date.now },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

const User = mongoose.model('User', userSchema);

const messageSchema = new mongoose.Schema({
  username:  { type: String, required: true },
  text:      { type: String, required: true },
  room:      { type: String, default: 'general' },
  timestamp: { type: Date, default: Date.now },
});

const Message = mongoose.model('Message', messageSchema);

// ─── JWT Helpers ──────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_dev_key_change_in_prod';
const JWT_EXPIRES = '7d';

function signToken(userId) {
  return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}

// ─── Auth Middleware ──────────────────────────────────────────────────────────
function protect(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated. Please log in.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

// ─── Auth Routes ──────────────────────────────────────────────────────────────

// POST /api/auth/signup
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ message: 'Username or email already taken.' });
    }

    const user = await User.create({ username, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: 'Server error during signup.' });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = signToken(user._id);

    res.json({
      message: 'Login successful!',
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login.' });
  }
});

// GET /api/auth/me  — protected route example
app.get('/api/auth/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found.' });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// ─── Sports News Route ────────────────────────────────────────────────────────
// Returns mock/static sports news (swap for a real API like NewsAPI or ESPN)
app.get('/api/sports/news', async (req, res) => {
  const mockNews = [
    {
      id: 1,
      title: 'Champions League Quarter-Finals Set for Explosive Showdown',
      category: 'Football',
      summary: 'Eight elite clubs battle for a place in the semis as top seeds face surprising challengers from across Europe.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600',
    },
    {
      id: 2,
      title: 'NBA Playoffs Race Tightens in the West — Three Teams Tied',
      category: 'Basketball',
      summary: 'With only two weeks left in the regular season, the Western Conference standings are almost impossibly close at positions 4-6.',
      timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600',
    },
    {
      id: 3,
      title: 'World Athletics: New 100m Record Shocks Tokyo Stadium',
      category: 'Athletics',
      summary: "A 21-year-old sprinter shattered the world record by 0.04 seconds, sending the crowd into absolute frenzy at tonight's Diamond League meet.",
      timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600',
    },
    {
      id: 4,
      title: 'Formula 1: Strategy Battle Defines Bahrain Grand Prix Winner',
      category: 'Motorsport',
      summary: 'A bold two-stop strategy by the lead constructor team overturned a 9-second deficit in the final 15 laps.',
      timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1541343672885-9be56236302a?w=600',
    },
    {
      id: 5,
      title: 'Tennis: Surprise Semi-Final Run at Roland Garros Continues',
      category: 'Tennis',
      summary: 'Ranked 78th in the world, the unseeded Croatian has defeated three top-10 players en route to a stunning last-four appearance.',
      timestamp: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1551958219-acbc595d4cdd?w=600',
    },
    {
      id: 6,
      title: 'Rugby World Cup Hosts Announced for 2031 — Fans React',
      category: 'Rugby',
      summary: "World Rugby confirmed the next three tournament locations after a record-breaking vote, with major implications for global broadcast rights.",
      timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
      imageUrl: 'https://images.unsplash.com/photo-1599058917765-a780eda07a3e?w=600',
    },
  ];

  res.json({ news: mockNews, total: mockNews.length });
});

// ─── Scores & Standings Route ─────────────────────────────────────────────────
app.get('/api/sports/scores', (req, res) => {
  const mockScoresData = {
    matches: {
      'Premier League': [
        { home: 'Arsenal',          away: 'Man City',     homeScore: 2,   awayScore: 1,  status: 'FT',   minute: 90, kickoff: '15:00', league: 'Premier League' },
        { home: 'Liverpool',        away: 'Chelsea',      homeScore: 1,   awayScore: 1,  status: 'LIVE', minute: 67, kickoff: '17:30', league: 'Premier League' },
        { home: 'Man United',       away: 'Tottenham',    homeScore: 0,   awayScore: 0,  status: 'LIVE', minute: 34, kickoff: '17:30', league: 'Premier League' },
        { home: 'Aston Villa',      away: 'Newcastle',    homeScore: 0,   awayScore: 0,  status: 'NS',   minute: 0,  kickoff: '20:00', league: 'Premier League' },
        { home: 'Brighton',         away: 'Brentford',    homeScore: 0,   awayScore: 0,  status: 'NS',   minute: 0,  kickoff: '20:00', league: 'Premier League' },
      ],
      'La Liga': [
        { home: 'Real Madrid',      away: 'Barcelona',    homeScore: 3,   awayScore: 2,  status: 'FT',   minute: 90, kickoff: '21:00', league: 'La Liga' },
        { home: 'Atletico Madrid',  away: 'Sevilla',      homeScore: 1,   awayScore: 0,  status: 'LIVE', minute: 55, kickoff: '19:00', league: 'La Liga' },
        { home: 'Real Sociedad',    away: 'Villarreal',   homeScore: 0,   awayScore: 0,  status: 'NS',   minute: 0,  kickoff: '22:00', league: 'La Liga' },
      ],
      'NBA': [
        { home: 'Boston Celtics',   away: 'Miami Heat',   homeScore: 108, awayScore: 97, status: 'FT',   minute: 48, kickoff: '19:30', league: 'NBA' },
        { home: 'LA Lakers',        away: 'Golden State', homeScore: 92,  awayScore: 88, status: 'LIVE', minute: 36, kickoff: '22:00', league: 'NBA' },
        { home: 'Denver Nuggets',   away: 'Phoenix Suns', homeScore: 0,   awayScore: 0,  status: 'NS',   minute: 0,  kickoff: '21:00', league: 'NBA' },
      ],
    },
    standings: {
      'Premier League': [
        { club: 'Arsenal',        p: 30, w: 22, d: 5, l: 3,  gd: +42, pts: 71 },
        { club: 'Man City',       p: 30, w: 21, d: 6, l: 3,  gd: +39, pts: 69 },
        { club: 'Liverpool',      p: 30, w: 20, d: 7, l: 3,  gd: +36, pts: 67 },
        { club: 'Aston Villa',    p: 30, w: 18, d: 4, l: 8,  gd: +18, pts: 58 },
        { club: 'Tottenham',      p: 30, w: 16, d: 5, l: 9,  gd: +12, pts: 53 },
        { club: 'Chelsea',        p: 30, w: 14, d: 7, l: 9,  gd:  +8, pts: 49 },
        { club: 'Newcastle',      p: 30, w: 14, d: 6, l: 10, gd:  +6, pts: 48 },
        { club: 'Man United',     p: 30, w: 13, d: 5, l: 12, gd:  -3, pts: 44 },
        { club: 'Brighton',       p: 30, w: 12, d: 7, l: 11, gd:  +4, pts: 43 },
        { club: 'West Ham',       p: 30, w: 11, d: 6, l: 13, gd:  -5, pts: 39 },
        { club: 'Wolves',         p: 30, w: 10, d: 7, l: 13, gd:  -8, pts: 37 },
        { club: 'Everton',        p: 30, w:  9, d: 8, l: 13, gd: -10, pts: 35 },
        { club: 'Brentford',      p: 30, w:  9, d: 6, l: 15, gd:  -9, pts: 33 },
        { club: 'Crystal Palace', p: 30, w:  8, d: 7, l: 15, gd: -12, pts: 31 },
        { club: 'Fulham',         p: 30, w:  8, d: 6, l: 16, gd: -14, pts: 30 },
        { club: 'Bournemouth',    p: 30, w:  7, d: 7, l: 16, gd: -16, pts: 28 },
        { club: 'Nottm Forest',   p: 30, w:  6, d: 8, l: 16, gd: -18, pts: 26 },
        { club: 'Luton',          p: 30, w:  5, d: 7, l: 18, gd: -25, pts: 22 },
        { club: 'Burnley',        p: 30, w:  4, d: 5, l: 21, gd: -30, pts: 17 },
        { club: 'Sheffield Utd',  p: 30, w:  3, d: 4, l: 23, gd: -35, pts: 13 },
      ],
      'La Liga': [
        { club: 'Real Madrid',     p: 29, w: 22, d: 4, l: 3,  gd: +45, pts: 70 },
        { club: 'Barcelona',       p: 29, w: 19, d: 5, l: 5,  gd: +32, pts: 62 },
        { club: 'Atletico Madrid', p: 29, w: 18, d: 5, l: 6,  gd: +21, pts: 59 },
        { club: 'Athletic Bilbao', p: 29, w: 14, d: 7, l: 8,  gd: +12, pts: 49 },
        { club: 'Villarreal',      p: 29, w: 13, d: 6, l: 10, gd:  +7, pts: 45 },
        { club: 'Real Betis',      p: 29, w: 12, d: 7, l: 10, gd:  +4, pts: 43 },
        { club: 'Real Sociedad',   p: 29, w: 11, d: 8, l: 10, gd:  +2, pts: 41 },
      ],
      'NBA': [],
    },
  };
  res.json(mockScoresData);
});

// ─── Socket.io — Live Chat ────────────────────────────────────────────────────
// Store recent messages in-memory (persisted ones come from MongoDB)
let onlineUsers = {};

io.on('connection', (socket) => {
  console.log(`⚡  Socket connected: ${socket.id}`);

  // Client joins a chat room
  socket.on('join_room', async ({ room, username }) => {
    socket.join(room);
    onlineUsers[socket.id] = { username, room };

    // Load last 30 messages from DB
    try {
      const history = await Message.find({ room })
        .sort({ timestamp: -1 })
        .limit(30)
        .lean();
      socket.emit('message_history', history.reverse());
    } catch (err) {
      console.error('Error loading message history:', err);
    }

    // Notify room a user joined
    socket.to(room).emit('user_joined', {
      username,
      message: `${username} joined the chat`,
      timestamp: new Date().toISOString(),
    });

    // Broadcast updated online count
    io.to(room).emit('online_count', countUsersInRoom(room));
  });

  // Client sends a message
  socket.on('send_message', async ({ room, username, text }) => {
    if (!text || !text.trim()) return;

    const msgData = {
      username,
      text: text.trim(),
      room,
      timestamp: new Date().toISOString(),
    };

    // Save to MongoDB
    try {
      await Message.create(msgData);
    } catch (err) {
      console.error('Error saving message:', err);
    }

    // Broadcast to everyone in room (including sender)
    io.to(room).emit('receive_message', msgData);
  });

  // Typing indicator
  socket.on('typing', ({ room, username }) => {
    socket.to(room).emit('user_typing', { username });
  });

  socket.on('stop_typing', ({ room }) => {
    socket.to(room).emit('user_stop_typing');
  });

  // Disconnect
  socket.on('disconnect', () => {
    const user = onlineUsers[socket.id];
    if (user) {
      socket.to(user.room).emit('user_left', {
        username: user.username,
        message: `${user.username} left the chat`,
      });
      delete onlineUsers[socket.id];
      io.to(user.room).emit('online_count', countUsersInRoom(user.room));
    }
    console.log(`🔌  Socket disconnected: ${socket.id}`);
  });
});

function countUsersInRoom(room) {
  return Object.values(onlineUsers).filter((u) => u.room === room).length;
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date() });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`🚀  Server running on http://localhost:${PORT}`);
  console.log(`🔑  JWT Auth ready`);
  console.log(`💬  Socket.io live chat ready`);
});

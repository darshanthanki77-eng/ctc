require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorMiddleware');
const path = require('path');

// DB connection — awaited per-request as middleware (safe for Vercel serverless cold starts)
// connectDB has isConnected guard so it only connects once per warm instance

// Cron jobs only in local dev (Vercel uses cron endpoint)
if (process.env.NODE_ENV !== 'production') {
  require('./cron/miningCron');
  require('./cron/salaryCron');
}

const app = express();
app.set('trust proxy', 1);

// Socket.IO only works in local dev — Vercel serverless has no persistent connections
let server = app;
if (process.env.NODE_ENV !== 'production') {
  const http = require('http');
  const { Server } = require('socket.io');
  server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });
  app.set('io', io);
  io.on('connection', (socket) => {
    console.log('User connected via socket:', socket.id);
    socket.on('join', (userId) => { socket.join(userId); });
    socket.on('disconnect', () => { console.log('User disconnected:', socket.id); });
  });
}

// Middleware
// Ensure DB is connected before every request (handles Vercel cold starts)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    res.status(503).json({ message: 'Database unavailable. Please try again.' });
  }
});

app.use(helmet({ crossOriginResourcePolicy: false })); // Security headers
app.use(cors({ origin: true, credentials: true })); // Enable CORS dynamically
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve uploaded files

// NOTE: On Vercel, static files are served via CDN (vercel.json routes).
// Do NOT use app.get('*') here — newer path-to-regexp rejects bare '*' wildcard.

app.use(morgan('dev')); // HTTP request logger

// Rate limiting (High limit in development to prevent 429 blocks)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 2000 : 100000, // High cap for local development
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV !== 'production' // Skip rate limiting in local development
});
app.use('/api/', apiLimiter);

// Health check — debug endpoint for Vercel deployment
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    env: {
      NODE_ENV: process.env.NODE_ENV,
      MONGO_URI: !!process.env.MONGO_URI,
      JWT_SECRET: !!process.env.JWT_SECRET,
      CRON_SECRET: !!process.env.CRON_SECRET,
    },
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/package', require('./routes/packageRoutes'));
app.use('/api/transaction', require('./routes/transactionRoutes'));
app.use('/api/withdrawal', require('./routes/withdrawalRoutes'));
app.use('/api/kyc', require('./routes/kycRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Cron endpoint — called by Vercel Cron or GitHub Actions every 12 hours
app.get('/api/cron/mining', async (req, res) => {
  // Security: only allow requests with valid CRON_SECRET token
  // Support both Vercel standard (Authorization: Bearer <token>) and legacy custom header (x-cron-token)
  const authHeader = req.headers['authorization'] || req.headers['Authorization'];
  const token = req.headers['x-cron-token'];
  const expectedBearer = `Bearer ${process.env.CRON_SECRET}`;

  const isAuthorized = 
    (token && token === process.env.CRON_SECRET) || 
    (authHeader && authHeader === expectedBearer);

  if (!isAuthorized) {
    console.warn('[CRON] ⛔ Unauthorized cron attempt blocked');
    return res.status(403).json({ success: false, message: 'Unauthorized' });
  }

  console.log('============================================');
  console.log('[CRON] ✅ CRON JOB IS RUNNING (via Vercel Cron)');
  console.log(`[CRON] Triggered at: ${new Date().toUTCString()}`);
  console.log('============================================');
  try {
    const { runMiningCronCycle } = require('./cron/miningCron');
    const force = req.query.force === 'true';
    const result = await runMiningCronCycle(force);
    if (result.success) {
      console.log('[CRON] ✅ CRON JOB FINISHED SUCCESSFULLY');
    } else {
      console.warn(`[CRON] ⚠️ CRON SKIPPED — Reason: ${result.reason}`);
    }
    return res.status(200).json({ success: true, result });
  } catch (error) {
    console.error('============================================');
    console.error('[CRON] ❌ CRON JOB ERROR — FAILED TO RUN');
    console.error(`[CRON] Error: ${error.message}`);
    console.error('============================================');
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('CTC API is running...');
});

// Error Middleware
app.use(errorHandler);

// Only bind to a port when running locally (not on Vercel serverless)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5001;
  server.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
  });
}

module.exports = app;

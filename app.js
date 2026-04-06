const express = require('express');
const cors = require('cors');

const authRoutes = require('./src/routes/auth.routes');
const adminRoutes = require('./src/routes/admin.routes');
const clientRoutes = require('./src/routes/client.routes');
const agentRoutes = require('./src/routes/agent.routes');

const app = express();

app.use(express.json());

// CORS Config: Support Multiple URLs (dev + production)
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = [
      'https://loan-managment-24-03.netlify.app',
      'https://sprightly-hamster-5a3b38.netlify.app',
      'https://loan-sanju-production.up.railway.app',
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://127.0.0.1:5173',
      'https://loan-management.kiaansoftware.com'
    ].filter(Boolean);
    
    // Check if origin is allowed or if it's a sub-domain of Railway
    if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.up.railway.app')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Route Definitions
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/agent', agentRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Error Handler]', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

module.exports = app;

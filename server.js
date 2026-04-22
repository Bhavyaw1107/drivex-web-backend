const express = require('express');
const cors = require('cors');
require('dotenv').config();

const connectDB = require('./src/config/db');

// ✅ Clerk middleware
const { clerkMiddleware } = require('./src/middleware/authMiddleware');

const app = express(); // ✅ CREATE APP FIRST

// ✅ APPLY CLERK AFTER APP
app.use(clerkMiddleware());


// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://drivex-web-frontend-production.up.railway.app",
    "https://drivex-web-frontend.onrender.com"
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const fileRoutes = require('./src/routes/fileRoutes');
const folderRoutes = require('./src/routes/folderRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/admin', adminRoutes);


app.get('/', (req, res) => {
  res.json({
    name: 'DriveX API',
    status: 'ok',
    health: '/api/health',
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("SERVER ERROR:", err);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});

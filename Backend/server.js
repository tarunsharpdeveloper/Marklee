import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import onboardingRoutes from './routes/onboarding.js';
import briefRoutes from './routes/briefRoutes.js';
import adminRoutes from './routes/admin.js';
import { pool as db , testConnection } from './config/database.js';
import marketingRoutes from './routes/marketingRoutes.js';
import brandRoutes from './routes/brandRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api', briefRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/brands', brandRoutes);

// Debug middleware to log all requests
app.use('/api/brands', (req, res, next) => {
    console.log(`Brand API Request: ${req.method} ${req.path}`);
    next();
});

// Test database connection
testConnection()
  .then(success => {
    if (!success) {
      console.log('Please check your database configuration');
    }
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
}); 
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/roomRoutes'); // Import room routes
const residentRoutes = require('./routes/residentRoutes');
const billingRoutes = require('./routes/billingRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes'); // Import maintenance routes

dotenv.config();
const app = express();

connectDB();

app.use(cors({
  origin: process.env.FRONTEND_URL, // Allow only the frontend URL
  credentials: true, // Allow credentials (cookies)
}));
app.use(express.json());

// Set Content Security Policy headers
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "script-src 'self' https://checkout.razorpay.com 'unsafe-inline' 'unsafe-eval';"
  );
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes); // Use room routes
app.use('/api/residents', residentRoutes);
app.use('/api/maintenance', maintenanceRoutes); // Use maintenance routes
app.use('/api/billing', billingRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/notifications', notificationRoutes);

// Default route for /api
app.get('/api', (req, res) => {
  res.send('API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
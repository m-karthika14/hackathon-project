const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.js');
const reportRoutes = require('./routes/report.js');
const faceMonitorRoutes = require('./routes/faceMonitor.js');
const insightRoutes = require('./routes/insights.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/face', faceMonitorRoutes);
app.use('/api/insights', insightRoutes);

const PORT = process.env.PORT || 5000;

// If MONGO_URI is provided, attempt to connect. Otherwise start server in a "DB-less" dev mode.
if (process.env.MONGO_URI) {
  // Modern mongoose no longer needs the legacy options; pass the URI only.
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log('MongoDB connected successfully');
      app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    })
    .catch((error) => {
      console.error('Failed to connect to MongoDB:', error.message);
      // Still start the server so the frontend can be developed against non-DB endpoints.
      app.listen(PORT, () => console.log(`Server running on port: ${PORT} (without DB)`));
    });
} else {
  console.warn('MONGO_URI not set — starting server without connecting to MongoDB. Some features may be disabled.');
  app.listen(PORT, () => console.log(`Server running on port: ${PORT} (no DB)`));
}

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth.js');
const reportRoutes = require('./routes/report.js');
const faceMonitorRoutes = require('./routes/faceMonitor.js');
const insightRoutes = require('./routes/insights.js');
const logsRoutes = require('./routes/logs.js');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/face', faceMonitorRoutes);
app.use('/api/insights', insightRoutes);
app.use('/api/logs', logsRoutes);

const PORT = process.env.PORT || 5000;

// If MONGO_URI is provided, attempt to connect. Otherwise, for developer convenience
// spin up an in-memory mongod using mongodb-memory-server so integration tests and
// local verification can run without an external Mongo instance.
const startServer = async () => {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      console.log('MongoDB connected successfully');
      try {
        console.log('MongoDB connection info -> host:', mongoose.connection.host, 'name:', mongoose.connection.name, 'port:', mongoose.connection.port);
      } catch (e) { console.log('MongoDB connection details unavailable'); }
      app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err.message);
      app.listen(PORT, () => console.log(`Server running on port: ${PORT} (without DB)`));
    }
    return;
  }

  // Dev fallback: use mongodb-memory-server
  try {
    console.warn('MONGO_URI not set — starting embedded in-memory MongoDB for development.');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log('In-memory MongoDB started and connected (dev only)');
    app.listen(PORT, () => console.log(`Server running on port: ${PORT} (using in-memory MongoDB)`));
    // Keep a reference so process exit can stop the in-memory server if needed
    process.on('SIGINT', async () => {
      await mongoose.disconnect();
      await mongod.stop();
      process.exit(0);
    });
  } catch (err) {
    console.error('Failed to start in-memory MongoDB:', err.message);
    app.listen(PORT, () => console.log(`Server running on port: ${PORT} (no DB)`));
  }
};

startServer();

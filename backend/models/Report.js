const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // same user for both games
  gameType: {
    type: String,
    required: true,
    enum: ['neurobalance', 'NeuroMatrix-ADHD', 'typing', 'ptsd'] // enforce only these four
  },
  scores: {
    // These fields are optional; ADHD can leave most at 0 or provide its own mapping
    motorControl: { type: Number, default: 0 },
    cognitiveLoad: { type: Number, default: 0 },
    stressManagement: { type: Number, default: 0 },
    behavioralStability: { type: Number, default: 0 },
    neuroBalance: { type: Number, default: 0 },
    // optional ADHD-specific summary numbers
    accuracy: { type: Number, default: 0 },
    speed: { type: Number, default: 0 },
    consistency: { type: Number, default: 0 },
    flexibility: { type: Number, default: 0 },
    memory: { type: Number, default: 0 }
  },
  performanceLog: [mongoose.Schema.Types.Mixed], // trial logs etc.
  gameMetrics: mongoose.Schema.Types.Mixed,      // free form for any game
  summary: [mongoose.Schema.Types.Mixed],
  aiAnalysis: { type: String },
  createdAt: { type: Date, default: Date.now },
  aiJsonReport: { type: Object },
  aiTextReport: { type: String }
}, { strict: false }); // allow any extra keys you might send later

module.exports = mongoose.model('Report', reportSchema);

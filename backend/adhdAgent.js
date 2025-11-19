/**
 * ADHD GAME ANALYSIS AGENT
 * Analyzes ALL USERS in DB → ALL SESSIONS → ALL "adhd" games
 * Computes metrics + stores analysisMetrics in DB
 */

const { MongoClient, ObjectId } = require("mongodb");

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://moneyprinter:naren123@mindmirror.uzsvxk0.mongodb.net/?appName=mindmirror";
const DB_NAME = process.env.DB_NAME || "test";
const USERS_COLLECTION = process.env.USERS_COLL || "users";
const REPORT_FIELD = process.env.REPORT_FIELD || "adhdAnalysisReport";

function calculateMetrics(logs) {
  const reactionTimes = logs
    .filter((l) => typeof l.reactionTime === "number")
    .map((l) => l.reactionTime);

  const rtMean =
    reactionTimes.length > 0
      ? reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length
      : 0;

  const rtVariance =
    reactionTimes.length > 1
      ? reactionTimes
          .map((rt) => Math.pow(rt - rtMean, 2))
          .reduce((a, b) => a + b, 0) /
        (reactionTimes.length - 1)
      : 0;
  const rtStdDev = Math.sqrt(rtVariance);

  const falsePositives = logs.filter(
    (l) => !l.isCorrect && l.userResponse !== ""
  ).length;

  const falseNegatives = logs.filter(
    (l) => l.userResponse === "" || l.userResponse == null
  ).length;

  const speedingTaps = logs.filter(
    (l) => l.reactionTime > 0 && l.reactionTime < 200
  ).length;

  const timeouts = logs.filter((l) => l.reactionTime >= 1500).length;

  let errorClusters = 0;
  for (let i = 0; i < logs.length - 5; i++) {
    const windowLogs = logs.slice(i, i + 5);
    const errors = windowLogs.filter((l) => !l.isCorrect).length;
    if (errors >= 3) {
      errorClusters++;
    }
  }

  const accuracy =
    logs.length > 0
      ? logs.filter((l) => l.isCorrect).length / logs.length
      : 0;

  // NORMALIZE ALL METRICS TO 0-100 SCALE

  // Cognitive Load: Based on processing complexity (lower stdDev and fewer errors = better)
  // Scale: High accuracy and low variability = high score
  const cognitiveLoadScore = (accuracy * 50) + Math.max(0, (50 - (rtStdDev / 50)));
  const cognitiveLoad = Number(Math.max(0, Math.min(100, cognitiveLoadScore)).toFixed(2));

  // Motor Control: Based on speed control and consistency
  const motorControlScore = 100 - (speedingTaps * 3) - (rtStdDev / 50);
  const motorControl = Number(Math.max(0, Math.min(100, motorControlScore)).toFixed(2));

  // Neuro Balance: Based on error types
  const neuroBalanceScore = 100 - (falsePositives * 2) - (falseNegatives * 3);
  const neuroBalance = Number(Math.max(0, Math.min(100, neuroBalanceScore)).toFixed(2));

  // Behavioral Stability: Based on consistency and timeout patterns
  const behavioralStabilityScore = 100 - (errorClusters * 3) - (timeouts * 2.5) - (rtStdDev / 100);
  const behavioralStability = Number(Math.max(0, Math.min(100, behavioralStabilityScore)).toFixed(2));

  return {
    reactionTimeMean: rtMean,
    reactionTimeStdDev: rtStdDev,
    falsePositives,
    falseNegatives,
    speedingTaps,
    timeouts,
    errorClusters,
    accuracy,
    cognitiveLoad: cognitiveLoad,
    motorControl: motorControl,
    neuroBalance: neuroBalance,
    behavioralStability: behavioralStability,
    rawRTs: reactionTimes,
  };
}

async function runADHDAgent() {
  console.log("🚀 Starting ADHD Analysis Agent...");
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db(DB_NAME);
  const users = db.collection(USERS_COLLECTION);

  const allUsers = await users.find({}).toArray();
  console.log(`📌 Found ${allUsers.length} users to analyze.`);

  for (const user of allUsers) {
    console.log(`👤 Analyzing user: ${user._id}`);
    const report = {
      userId: user._id.toString(),
      generatedAt: new Date().toISOString(),
      gamesAnalyzed: [],
    };
    if (!user.sessions || user.sessions.length === 0) {
      await users.updateOne(
        { _id: new ObjectId(user._id) },
        { $set: { [REPORT_FIELD]: report } }
      );
      continue;
    }

    for (let s = 0; s < user.sessions.length; s++) {
      const session = user.sessions[s];
      console.log(`   ▶ Session ${session.sessionNumber}`);
      if (!session.games || session.games.length === 0) continue;

      for (let g = 0; g < session.games.length; g++) {
        const game = session.games[g];
        if ((game.type || "").toLowerCase() !== "adhd") continue;

        console.log(`      🎮 Found ADHD game. Processing logs...`);
        const logs = game.logs || [];
        if (logs.length < 3) {
          console.log("      ⚠ Not enough logs, skipping game.");
          continue;
        }

        const metrics = calculateMetrics(logs);

        // Calculate attention scores from ADHD logs directly
        // avg_attention_score: based on accuracy
        const avgAttentionScore = Number((metrics.accuracy * 100).toFixed(2));
        
        // max_attention_score: based on best performance (accuracy + consistency bonus)
        // Ensure it never goes below avgAttentionScore and stays within 0-100
        const consistencyBonus = Math.max(0, Math.min(50, (100 - metrics.reactionTimeStdDev / 10)));
        const maxAttentionScore = Number(Math.max(avgAttentionScore, Math.min(100, avgAttentionScore + consistencyBonus)).toFixed(2));

        // Calculate final attention as average of both scores, normalized to 0-100
        let finalAttention = null;
        if (avgAttentionScore !== null && maxAttentionScore !== null) {
          const avgScore = (avgAttentionScore + maxAttentionScore) / 2;
          finalAttention = Number(Math.max(0, Math.min(100, avgScore)).toFixed(2));
        }

        // Calculate cognitive performance as weighted average of all 5 metrics
        let cognitivePerformance = null;
        if (finalAttention !== null) {
          const weightedScore = (
            (finalAttention * 0.30) +
            (metrics.motorControl * 0.20) +
            (metrics.behavioralStability * 0.20) +
            (metrics.neuroBalance * 0.15) +
            (metrics.cognitiveLoad * 0.15)
          );
          cognitivePerformance = Number(Math.max(0, Math.min(100, weightedScore)).toFixed(2));
        }

        // Add attention scores to metrics
        const enrichedMetrics = {
          ...metrics,
          avg_attention_score: avgAttentionScore,
          max_attention_score: maxAttentionScore,
          finalAttention: finalAttention,
          cognitivePerformance: cognitivePerformance,
        };

        await users.updateOne(
          { _id: new ObjectId(user._id) },
          {
            $set: {
              [`sessions.${s}.games.${g}.analysisMetrics`]: enrichedMetrics,
            },
          }
        );

        report.gamesAnalyzed.push({
          sessionNumber: session.sessionNumber ?? s,
          gameIndex: g,
          metrics: enrichedMetrics,
        });

        console.log("      ✅ Metrics saved:", enrichedMetrics);
      }
    }

    await users.updateOne(
      { _id: new ObjectId(user._id) },
      { $set: { [REPORT_FIELD]: report } }
    );
    console.log(`   🗂 Report stored in field '${REPORT_FIELD}'.`);
  }

  console.log("🎯 ADHD Analysis Agent Completed.");
  await client.close();
}

runADHDAgent().catch((err) => console.error(err));


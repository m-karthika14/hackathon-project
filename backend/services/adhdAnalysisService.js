/**
 * ADHD Analysis Service
 * Calculates cognitive metrics for ADHD game sessions
 */

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

async function analyzeADHDGame(user, sessionIndex, gameIndex) {
  try {
    console.log(`[ADHD Analysis] Analyzing user ${user._id}, session ${sessionIndex}, game ${gameIndex}`);
    
    const session = user.sessions[sessionIndex];
    if (!session) {
      console.log(`[ADHD Analysis] Session not found`);
      return null;
    }

    const game = session.games[gameIndex];
    if (!game || game.type.toLowerCase() !== 'adhd') {
      console.log(`[ADHD Analysis] Game not found or not ADHD type`);
      return null;
    }

    const logs = game.logs || [];
    if (logs.length < 3) {
      console.log(`[ADHD Analysis] Not enough logs (${logs.length}), skipping`);
      return null;
    }

    // Calculate base metrics
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

    // Build enriched metrics object
    const enrichedMetrics = {
      ...metrics,
      avg_attention_score: avgAttentionScore,
      max_attention_score: maxAttentionScore,
      finalAttention: finalAttention,
      cognitivePerformance: cognitivePerformance,
      analyzedAt: new Date().toISOString(),
    };

    console.log(`[ADHD Analysis] ✅ Metrics calculated:`, {
      cognitiveLoad: enrichedMetrics.cognitiveLoad,
      motorControl: enrichedMetrics.motorControl,
      neuroBalance: enrichedMetrics.neuroBalance,
      behavioralStability: enrichedMetrics.behavioralStability,
      finalAttention: enrichedMetrics.finalAttention,
      cognitivePerformance: enrichedMetrics.cognitivePerformance,
    });

    return enrichedMetrics;
  } catch (error) {
    console.error(`[ADHD Analysis] Error:`, error.message);
    return null;
  }
}

module.exports = {
  analyzeADHDGame,
  calculateMetrics,
};

const { MongoClient } = require("mongodb");

const MONGO_URI = "mongodb+srv://moneyprinter:naren123@mindmirror.uzsvxk0.mongodb.net/?appName=mindmirror";

async function checkCompletedSessions() {
  const client = new MongoClient(MONGO_URI);
  await client.connect();
  const db = client.db("test");
  const users = db.collection("users");

  const allUsers = await users.find({}).toArray();
  console.log(`\n📊 Total users: ${allUsers.length}\n`);

  for (const user of allUsers) {
    console.log(`\n👤 User: ${user._id}`);
    console.log(`   game field: "${user.game}"`);
    console.log(`   Sessions: ${user.sessions?.length || 0}`);

    if (user.sessions && user.sessions.length > 0) {
      for (let i = 0; i < user.sessions.length; i++) {
        const session = user.sessions[i];
        console.log(`\n   📁 Session ${i}:`);
        console.log(`      - sessionNumber: ${session.sessionNumber}`);
        console.log(`      - isStart: ${session.isStart}`);
        console.log(`      - isEnd: ${session.isEnd}`);
        console.log(`      - games: ${session.games?.length || 0}`);

        if (session.games) {
          for (let j = 0; j < session.games.length; j++) {
            const game = session.games[j];
            console.log(`\n      🎮 Game ${j}:`);
            console.log(`         - type: ${game.type}`);
            console.log(`         - logs: ${game.logs?.length || 0}`);
            console.log(`         - end: ${game.end}`);
            console.log(`         - hasGameReport: ${!!game.gameReport}`);
            console.log(`         - hasAnalysisMetrics: ${!!game.analysisMetrics}`);

            if (game.type?.toLowerCase() === 'adhd') {
              console.log(`\n      ⚠️ ADHD GAME FOUND!`);
              if (game.gameReport) {
                console.log(`         - avg_attention_score: ${game.gameReport.avg_attention_score}`);
                console.log(`         - max_attention_score: ${game.gameReport.max_attention_score}`);
              }
              if (game.analysisMetrics) {
                console.log(`         ✅ Analysis Metrics:`);
                console.log(`            - finalAttention: ${game.analysisMetrics.finalAttention}`);
                console.log(`            - cognitivePerformance: ${game.analysisMetrics.cognitivePerformance}`);
                console.log(`            - motorControl: ${game.analysisMetrics.motorControl}`);
                console.log(`            - behavioralStability: ${game.analysisMetrics.behavioralStability}`);
              } else {
                console.log(`         ❌ NO ANALYSIS METRICS YET`);
              }
            }
          }
        }
      }
    }
  }

  await client.close();
  console.log(`\n✅ Check complete\n`);
}

checkCompletedSessions().catch(console.error);

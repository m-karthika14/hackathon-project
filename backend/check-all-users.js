require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function checkAllUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const users = await User.find().sort({ createdAt: -1 });
    console.log(`📊 Total users in database: ${users.length}\n`);

    users.forEach((user, index) => {
      console.log(`${'='.repeat(60)}`);
      console.log(`USER ${index + 1}:`);
      console.log(`   GuestId: ${user.guestId}`);
      console.log(`   game: ${user.game === null ? 'null' : `"${user.game}"`}`);
      console.log(`   createdAt: ${user.createdAt}`);
      console.log(`   Sessions: ${user.sessions.length}`);
      
      if (user.sessions.length > 0) {
        const lastSession = user.sessions[user.sessions.length - 1];
        console.log(`   Last Session:`);
        console.log(`     - sessionId: ${lastSession.sessionId}`);
        console.log(`     - isStart: ${lastSession.isStart}`);
        console.log(`     - isEnd: ${lastSession.isEnd}`);
        console.log(`     - games: ${lastSession.games.length}`);
        
        if (lastSession.games.length > 0) {
          console.log(`   Games in last session:`);
          lastSession.games.forEach((game, idx) => {
            console.log(`     ${idx + 1}. ${game.type}: end=${game.end || false}`);
          });
        }
      }
      console.log('');
    });

    // Find users with game="idle" or game=null after completing games
    const problemUsers = users.filter(u => {
      if (u.sessions.length === 0) return false;
      const lastSession = u.sessions[u.sessions.length - 1];
      const hasMario = lastSession.games.some(g => g.type === 'mario' && g.end === true);
      return hasMario && u.game !== 'end';
    });

    if (problemUsers.length > 0) {
      console.log(`\n❌ FOUND ${problemUsers.length} PROBLEM USER(S):`);
      problemUsers.forEach(u => {
        console.log(`   - ${u.guestId}: Has Mario end=true but game="${u.game}"`);
      });
    } else {
      console.log(`\n✅ No problem users found. All users with completed Mario have game="end"`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkAllUsers();

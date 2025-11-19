const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

(async () => {
  let mongod;
  try {
    mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    console.log('Starting in-memory MongoDB for test at', uri);
    await mongoose.connect(uri, {});

    const User = require('./models/User');

    console.log('Creating test user...');
    let user = await User.create({ email: 'test.schema@example.com', passwordHash: 'testhash' });
    console.log('Created user id=', user._id.toString());

    // Simulate clicking Start Assessment -> new session created and marked started
    console.log('Creating new top-level session (Start Assessment)...');
    const created = await User.createNewSession(user._id, { isStart: true });
    user = created.user;
    const sessionNumber = created.session.sessionNumber;
    console.log('New sessionNumber:', sessionNumber);

    // Append some maze logs into the session
    console.log('Appending two maze logs...');
    await User.appendMazeLog(user._id, 1, sessionNumber, { event: 'maze_move', x: 10, y: 20, ts: new Date().toISOString() });
    await User.appendMazeLog(user._id, 1, sessionNumber, { event: 'maze_collision', at: { x: 11, y: 21 }, ts: new Date().toISOString() });

    // End maze game inside session
    console.log('Ending maze game inside session...');
    await User.endGameInSession(user._id, sessionNumber, 'maze', 1);

    // Append some ADHD logs into same session
    console.log('Appending three ADHD trial logs...');
    await User.appendAdhdLog(user._id, 1, sessionNumber, { trial: 0, stimulus: 'A', rt: 320, correct: true, ts: new Date().toISOString() });
    await User.appendAdhdLog(user._id, 1, sessionNumber, { trial: 1, stimulus: 'B', rt: 210, correct: false, ts: new Date().toISOString() });
    await User.appendAdhdLog(user._id, 1, sessionNumber, { trial: 2, stimulus: 'C', rt: 450, correct: true, ts: new Date().toISOString() });

    // End ADHD block and mark session end using model helper
    console.log('Ending ADHD game inside session...');
    await User.endGameInSession(user._id, sessionNumber, 'adhd', 1);

    console.log('Marking session end via User.endSessionGeneric(...)');
    await User.endSessionGeneric(user._id, sessionNumber);

    // Verify session end fields were set
    const doc2 = await User.findById(user._id);
    const sess2 = doc2.sessions.find(s => s.sessionNumber === sessionNumber);
    if (!sess2) throw new Error('Session not found after end');
    if (!sess2.isEnd || !sess2.endTimeUTC) {
      console.error('Session end fields missing:', { isEnd: sess2.isEnd, endTimeUTC: sess2.endTimeUTC });
      throw new Error('Session end fields were not set by endSessionGeneric');
    }
    console.log('Session end recorded:', { isEnd: sess2.isEnd, endTimeUTC: sess2.endTimeUTC, endTimeIST: sess2.endTimeIST });

    // Fetch and print the saved user document
    const saved = await User.findById(user._id).lean();
    console.log('\nSaved user document:');
    console.log(JSON.stringify(saved, null, 2));

    // Validate structure: ensure arrays exist
    const sessions = saved.sessions;
    console.log('\nValidation summary:');
    console.log('sessions present:', Array.isArray(sessions));
    console.log('sessions[0].games present:', sessions && Array.isArray(sessions[0].games));
    console.log('sessions[0].games[0].logs length:', sessions && sessions[0].games[0] && sessions[0].games[0].logs.length);

    console.log('\nTest completed successfully.');
  } catch (err) {
    console.error('Test failed:', err);
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {}
    if (mongod) await mongod.stop();
    process.exit(0);
  }
})();

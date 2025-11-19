const User = require('../models/User.js');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'User exists but has no password set' });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    res.status(200).json({
      message: 'Login successful',
      userId: user._id.toString(),
      email: user.email
    });
  } catch (error) {
    res.status(500).json({ message: 'Error during login', error });
  }
};

const register = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newUser = new User({ email, passwordHash: hash, createdAt: new Date() });
    await newUser.save();

    res.status(201).json({
      message: 'User created successfully',
      userId: newUser._id.toString(),
      email: newUser.email
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
};

module.exports = { login, register };

// Create or return a guest account. Frontend should call this when user chooses "Continue as Guest".
const guest = async (req, res) => {
  try {
    // Always create a new guest document for each request. The frontend is expected
    // to supply a fresh guestId on each click; we will persist it and not attempt to
    // return or reuse an existing document. This ensures every guest button click
    // generates a new row in MongoDB rather than overwriting or returning an existing one.
    let { guestId } = req.body;
    if (!guestId) {
      guestId = 'guest_' + Math.floor(1000 + Math.random() * 9000);
    }

  // To avoid duplicate-key errors on an existing unique email index (some DBs
  // may have a unique index on `email`), populate a synthetic unique email for
  // guest records. This prevents collisions when many guest docs are created
  // without a real email address.
  const syntheticEmail = `guest+${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}@guest.local`;
    // If a guestId was provided and already exists, return the existing document
    let existing = null;
    try {
      existing = await User.findOne({ guestId });
    } catch (e) {
      existing = null;
    }

    if (existing) {
      console.log('[auth][guest] Found existing guest user, returning it:', guestId, existing._id.toString());
      return res.status(200).json({ message: 'Guest ready', guestId: existing.guestId, userId: existing._id.toString() });
    }

    const user = new User({ guestId, email: syntheticEmail, createdAt: new Date() });
    await user.save();
    console.log('[auth][guest] Created NEW guest user:', guestId, user._id.toString());

    return res.status(201).json({ message: 'Guest created', guestId: user.guestId, userId: user._id.toString() });
  } catch (error) {
    console.error('Error in guest auth:', error);
    return res.status(500).json({ message: 'Error creating guest', error: error.message });
  }
};

module.exports = { login, register, guest };

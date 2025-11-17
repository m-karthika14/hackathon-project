const User = require('../models/User.js');

const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if user already exists
    let user = await User.findOne({ email });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({ email, password });
      await user.save();
    }
    
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
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ email, password });
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

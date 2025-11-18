const express = require('express');
const { login, register, guest } = require('../controller/authController.js');

const router = express.Router();

router.post('/login', login);
router.post('/register', register);
router.post('/guest', guest);

module.exports = router;

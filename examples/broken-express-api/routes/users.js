const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// GET /api/users - List all users
router.get('/', userController.getAllUsers);

// GET /api/users/:id - Get user by ID (BUG: route defines :id, controller expects :userID)
router.get('/:id', userController.getUserById);

module.exports = router;

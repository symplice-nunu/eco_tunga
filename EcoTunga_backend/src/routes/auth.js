const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const auth = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/request-reset', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);
router.get('/users', auth, authController.getAllUsers);
router.delete('/users/:id', auth, authController.deleteUser);
router.put('/users/:id', auth, authController.updateUser);

module.exports = router; 
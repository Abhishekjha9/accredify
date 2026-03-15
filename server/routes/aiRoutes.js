const express = require('express');
const { body } = require('express-validator');
const { runCommand: handleCommand } = require('../controllers/aiController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.post(
    '/command',
    [
        body('message').trim().notEmpty().withMessage('Message is required'),
        body('context').optional().isObject(),
    ],
    validate,
    handleCommand
);

module.exports = router;

const express = require('express');
const { body } = require('express-validator');
const {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
} = require('../controllers/conversationController');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(auth);

router.get('/', getConversations);
router.post(
    '/',
    [body('otherUserId').notEmpty().withMessage('otherUserId is required')],
    validate,
    getOrCreateConversation
);

router.get('/:id/messages', getMessages);
router.post(
    '/:id/messages',
    [body('content').trim().notEmpty().withMessage('Message content is required')],
    validate,
    sendMessage
);

module.exports = router;

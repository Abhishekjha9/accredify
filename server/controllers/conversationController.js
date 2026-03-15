const conversationService = require('../services/conversationService');

/**
 * @route   GET /api/conversations
 */
const getConversations = async (req, res, next) => {
    try {
        const list = await conversationService.getConversations(req.user._id);
        res.status(200).json({ success: true, data: list });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/conversations - body: { otherUserId }
 */
const getOrCreateConversation = async (req, res, next) => {
    try {
        const { otherUserId } = req.body;
        if (!otherUserId) {
            return res.status(400).json({ success: false, message: 'otherUserId is required' });
        }
        const conv = await conversationService.getOrCreateConversation(req.user._id, otherUserId);
        res.status(200).json({ success: true, data: conv });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   GET /api/conversations/:id/messages
 */
const getMessages = async (req, res, next) => {
    try {
        const messages = await conversationService.getMessages(req.params.id, req.user._id);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

/**
 * @route   POST /api/conversations/:id/messages - body: { content }
 */
const sendMessage = async (req, res, next) => {
    try {
        const msg = await conversationService.sendMessage(
            req.params.id,
            req.user._id,
            req.body.content
        );
        res.status(201).json({ success: true, data: msg });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getConversations,
    getOrCreateConversation,
    getMessages,
    sendMessage,
};

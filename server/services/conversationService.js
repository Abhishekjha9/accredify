const Conversation = require('../models/Conversation');
const DirectMessage = require('../models/DirectMessage');

function normalizeParticipants(id1, id2) {
    const a = String(id1);
    const b = String(id2);
    return a < b ? [id1, id2] : [id2, id1];
}

/**
 * Get or create a conversation between current user and other user.
 */
async function getOrCreateConversation(userId, otherUserId) {
    if (String(userId) === String(otherUserId)) {
        const err = new Error('Cannot create conversation with yourself');
        err.statusCode = 400;
        throw err;
    }
    const [p1, p2] = normalizeParticipants(userId, otherUserId);
    let conv = await Conversation.findOne({ participants: [p1, p2] })
        .populate('participants', 'name email role trustScore');
    if (!conv) {
        conv = await Conversation.create({ participants: [p1, p2] });
        conv = await Conversation.findById(conv._id).populate('participants', 'name email role trustScore');
    }
    return conv;
}

/**
 * List conversations for a user (where they are a participant), ordered by lastMessageAt desc.
 */
async function getConversations(userId) {
    const list = await Conversation.find({ participants: userId })
        .sort({ lastMessageAt: -1 })
        .populate('participants', 'name role trustScore')
        .lean();
    return list.map((c) => ({
        ...c,
        otherUser: c.participants.find((p) => String(p._id) !== String(userId)),
    }));
}

/**
 * Get messages for a conversation. Caller must be a participant.
 */
async function getMessages(conversationId, userId) {
    const conv = await Conversation.findById(conversationId).lean();
    if (!conv) {
        const err = new Error('Conversation not found');
        err.statusCode = 404;
        throw err;
    }
    const inConv = conv.participants.some((p) => String(p) === String(userId));
    if (!inConv) {
        const err = new Error('Not part of this conversation');
        err.statusCode = 403;
        throw err;
    }
    const messages = await DirectMessage.find({ conversationId })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name role')
        .lean();
    return messages;
}

/**
 * Send a message. Updates conversation lastMessageAt.
 */
async function sendMessage(conversationId, userId, content) {
    const conv = await Conversation.findById(conversationId);
    if (!conv) {
        const err = new Error('Conversation not found');
        err.statusCode = 404;
        throw err;
    }
    const inConv = conv.participants.some((p) => String(p) === String(userId));
    if (!inConv) {
        const err = new Error('Not part of this conversation');
        err.statusCode = 403;
        throw err;
    }
    const trimmed = (content || '').trim();
    if (!trimmed) {
        const err = new Error('Message content is required');
        err.statusCode = 400;
        throw err;
    }
    const msg = await DirectMessage.create({
        conversationId,
        senderId: userId,
        content: trimmed,
    });
    conv.lastMessageAt = new Date();
    await conv.save();
    const populated = await DirectMessage.findById(msg._id)
        .populate('senderId', 'name role')
        .lean();
    return populated;
}

module.exports = {
    getOrCreateConversation,
    getConversations,
    getMessages,
    sendMessage,
};

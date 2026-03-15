const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
    {
        participants: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        }],
        lastMessageAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

// One conversation per pair; ensure order for uniqueness
conversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);

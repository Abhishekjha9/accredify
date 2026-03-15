const mongoose = require('mongoose');

const directMessageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        content: {
            type: String,
            required: [true, 'Message content is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
    },
    { timestamps: true }
);

directMessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('DirectMessage', directMessageSchema);

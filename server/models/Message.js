const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
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

messageSchema.index({ projectId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);

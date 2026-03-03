const mongoose = require('mongoose');

const changeRequestSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        description: {
            type: String,
            required: [true, 'Description is required'],
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        classification: {
            type: String,
            enum: {
                values: ['in-scope', 'out-of-scope'],
                message: 'Classification must be in-scope or out-of-scope',
            },
            // Set by freelancer when marking scope; null/undefined = pending
        },
        priceAdjustment: {
            type: Number,
            default: 0,
        },
        timelineAdjustment: {
            type: Number,
            default: 0,
        },
        approved: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('ChangeRequest', changeRequestSchema);

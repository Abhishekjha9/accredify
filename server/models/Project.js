const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
    {
        freelancerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Freelancer ID is required'],
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Client ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Project title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        scopeChecklist: {
            type: [String],
            default: [],
        },
        deliverables: [
            {
                title: { type: String, required: true },
                link: { type: String, required: true }, // URL for links, or /uploads/... for files
                description: String,
                type: {
                    type: String,
                    enum: { values: ['link', 'file'], message: 'Type must be link or file' },
                    default: 'link',
                },
                status: {
                    type: String,
                    enum: { values: ['pending', 'accepted', 'revision_requested'], message: 'Invalid status' },
                    default: 'pending',
                },
                clientFeedback: { type: String, default: null },
                submittedAt: { type: Date, default: Date.now },
            }
        ],
        revisionLimit: {
            type: Number,
            required: [true, 'Revision limit is required'],
            min: [0, 'Revision limit cannot be negative'],
        },
        revisionsUsed: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: {
                values: ['draft', 'active', 'completed'],
                message: 'Status must be draft, active, or completed',
            },
            default: 'draft',
        },
        /** Optional deadline (e.g. set when client approves). Used for trust scoring. */
        deadline: { type: Date, default: null },
        /** Set when project is marked complete. Used for deadline vs completion time. */
        completedAt: { type: Date, default: null },
        /** Computed when project completes: contribution to freelancer trust score. */
        trustImpact: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Project', projectSchema);

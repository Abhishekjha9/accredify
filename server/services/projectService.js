const Project = require('../models/Project');
const ChangeRequest = require('../models/ChangeRequest');
const Message = require('../models/Message');
const { computeTrustImpact, applyTrustAndScopeOnComplete } = require('./trustScoreService');

/**
 * Create a new project (freelancer-initiated).
 */
const createProject = async (data) => {
    const project = await Project.create(data);
    return project;
};

/**
 * Get a single project by ID with populated user references and change requests.
 */
const getProjectById = async (projectId) => {
    const project = await Project.findById(projectId)
        .populate('freelancerId', 'name email role trustScore')
        .populate('clientId', 'name email role trustScore');

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    const changeRequests = await ChangeRequest.find({ projectId }).sort({ createdAt: -1 });
    const po = project.toObject();
    po.changeRequests = changeRequests;
    return po;
};

/**
 * Approve a project (set status to active). Only the assigned client can approve.
 */
const approveProject = async (projectId, clientId, data = {}) => {
    const project = await Project.findById(projectId);

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    if (project.clientId.toString() !== clientId.toString()) {
        const error = new Error('Only the assigned client can approve this project');
        error.statusCode = 403;
        throw error;
    }

    if (project.status !== 'draft') {
        const error = new Error('Only draft projects can be approved');
        error.statusCode = 400;
        throw error;
    }

    project.status = 'active';
    if (data.deadline) project.deadline = new Date(data.deadline);
    await project.save();

    return project;
};

/**
 * Add a change request to a project.
 */
const addChangeRequest = async (data) => {
    const project = await Project.findById(data.projectId);

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    const changeRequest = await ChangeRequest.create(data);
    return changeRequest;
};

/**
 * Freelancer marks a change request as in-scope or out-of-scope.
 */
const classifyChangeRequest = async (projectId, changeRequestId, freelancerId, data) => {
    const project = await Project.findById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    if (project.freelancerId.toString() !== freelancerId.toString()) {
        const error = new Error('Only the assigned freelancer can classify change requests');
        error.statusCode = 403;
        throw error;
    }
    const cr = await ChangeRequest.findOne({ _id: changeRequestId, projectId });
    if (!cr) {
        const error = new Error('Change request not found');
        error.statusCode = 404;
        throw error;
    }
    cr.classification = data.classification;
    if (data.priceAdjustment != null) cr.priceAdjustment = data.priceAdjustment;
    if (data.timelineAdjustment != null) cr.timelineAdjustment = data.timelineAdjustment;
    await cr.save();
    return cr;
};

/**
 * Increment the revision counter on a project. Enforces the revision limit.
 */
const incrementRevision = async (projectId) => {
    const project = await Project.findById(projectId);

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    if (project.revisionsUsed >= project.revisionLimit) {
        const error = new Error(
            `Revision limit reached (${project.revisionLimit}). No more revisions allowed.`
        );
        error.statusCode = 400;
        throw error;
    }

    project.revisionsUsed += 1;
    await project.save();

    return project;
};

/**
 * Get all projects involving the specified user ID (freelancer or client).
 */
const getUserProjects = async (userId, role) => {
    const query = role === 'freelancer' ? { freelancerId: userId } : { clientId: userId };

    const projects = await Project.find(query)
        .sort({ createdAt: -1 })
        .populate('freelancerId', 'name email')
        .populate('clientId', 'name email');

    return projects;
};

/**
 * Add a deliverable (link or file). data = { title, link, description?, type }.
 */
const addDeliverable = async (projectId, freelancerId, data) => {
    const project = await Project.findById(projectId);

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    if (project.freelancerId.toString() !== freelancerId.toString()) {
        const error = new Error('Only the assigned freelancer can submit deliverables');
        error.statusCode = 403;
        throw error;
    }

    if (project.status !== 'active') {
        const error = new Error('Deliverables can only be submitted for active projects');
        error.statusCode = 400;
        throw error;
    }

    project.deliverables.push({
        title: data.title,
        link: data.link,
        description: data.description || '',
        type: data.type || 'link',
        status: 'pending',
    });
    await project.save();

    return project;
};

/**
 * Client accepts a deliverable.
 */
const acceptDeliverable = async (projectId, deliverableId, clientId) => {
    const project = await Project.findById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    if (project.clientId.toString() !== clientId.toString()) {
        const error = new Error('Only the assigned client can accept deliverables');
        error.statusCode = 403;
        throw error;
    }
    const d = project.deliverables.id(deliverableId);
    if (!d) {
        const error = new Error('Deliverable not found');
        error.statusCode = 404;
        throw error;
    }
    d.status = 'accepted';
    d.clientFeedback = null;
    await project.save();
    return project;
};

/**
 * Client requests revision for a deliverable. Increments the revision tracker.
 */
const requestDeliverableRevision = async (projectId, deliverableId, clientId, feedback) => {
    const project = await Project.findById(projectId);
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    if (project.clientId.toString() !== clientId.toString()) {
        const error = new Error('Only the assigned client can request revisions');
        error.statusCode = 403;
        throw error;
    }
    const d = project.deliverables.id(deliverableId);
    if (!d) {
        const error = new Error('Deliverable not found');
        error.statusCode = 404;
        throw error;
    }
    if (project.revisionsUsed >= project.revisionLimit) {
        const error = new Error(
            `Revision limit reached (${project.revisionLimit}). No more revisions can be requested.`
        );
        error.statusCode = 400;
        throw error;
    }
    d.status = 'revision_requested';
    d.clientFeedback = feedback || '';
    project.revisionsUsed += 1;
    await project.save();
    return project;
};

/**
 * Client marks project complete. All deliverables must be accepted.
 * Sets completedAt, computes trustImpact, updates freelancer trust score and scope metrics.
 */
const completeProject = async (projectId, clientId) => {
    const project = await Project.findById(projectId);

    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }

    if (project.clientId.toString() !== clientId.toString()) {
        const error = new Error('Only the assigned client can complete this project');
        error.statusCode = 403;
        throw error;
    }

    if (project.status !== 'active') {
        const error = new Error('Only active projects can be marked complete');
        error.statusCode = 400;
        throw error;
    }

    const allAccepted =
        project.deliverables &&
        project.deliverables.length > 0 &&
        project.deliverables.every((d) => d.status === 'accepted');

    if (!allAccepted) {
        const error = new Error('All deliverables must be accepted before completing the project');
        error.statusCode = 400;
        throw error;
    }

    project.status = 'completed';
    project.completedAt = new Date();
    const trustImpact = computeTrustImpact({
        ...project.toObject(),
        completedAt: project.completedAt,
    });
    project.trustImpact = trustImpact;
    await project.save();

    await applyTrustAndScopeOnComplete(project);

    return project;
};

/**
 * Ensure user is the project's client or freelancer.
 */
const ensureParticipant = async (projectId, userId) => {
    const project = await Project.findById(projectId).select('clientId freelancerId').lean();
    if (!project) {
        const error = new Error('Project not found');
        error.statusCode = 404;
        throw error;
    }
    const id = userId.toString();
    if (project.clientId.toString() !== id && project.freelancerId.toString() !== id) {
        const error = new Error('Only project client or freelancer can access this');
        error.statusCode = 403;
        throw error;
    }
    return project;
};

/**
 * List messages for a project (oldest first). Caller must be participant.
 */
const getProjectMessages = async (projectId, userId) => {
    await ensureParticipant(projectId, userId);
    const messages = await Message.find({ projectId })
        .sort({ createdAt: 1 })
        .populate('senderId', 'name role')
        .lean();
    return messages;
};

/**
 * Send a message in a project. Caller must be participant.
 */
const sendProjectMessage = async (projectId, userId, content) => {
    await ensureParticipant(projectId, userId);
    const trimmed = (content || '').trim();
    if (!trimmed) {
        const error = new Error('Message content is required');
        error.statusCode = 400;
        throw error;
    }
    const message = await Message.create({
        projectId,
        senderId: userId,
        content: trimmed,
    });
    const populated = await Message.findById(message._id)
        .populate('senderId', 'name role')
        .lean();
    return populated;
};

module.exports = {
    createProject,
    getProjectById,
    approveProject,
    addChangeRequest,
    classifyChangeRequest,
    incrementRevision,
    getUserProjects,
    addDeliverable,
    acceptDeliverable,
    requestDeliverableRevision,
    completeProject,
    getProjectMessages,
    sendProjectMessage,
};

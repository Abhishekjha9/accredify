const projectService = require('../services/projectService');
const User = require('../models/User');

/**
 * Resolve short client ID (last 6 chars of MongoDB _id) to full ObjectId.
 * If clientId is 6 hex chars, find the client user whose _id ends with it.
 */
const resolveClientId = async (clientId) => {
    if (!clientId || typeof clientId !== 'string') return clientId;
    const trimmed = clientId.trim();
    if (trimmed.length !== 6 || !/^[a-f0-9]{6}$/i.test(trimmed)) return clientId;
    const clients = await User.find({ role: 'client' }).select('_id').lean();
    const match = clients.filter((u) => String(u._id).slice(-6).toLowerCase() === trimmed.toLowerCase());
    if (match.length === 0) {
        const err = new Error('No client found with that short ID');
        err.statusCode = 400;
        throw err;
    }
    if (match.length > 1) {
        const err = new Error('Short ID matches multiple clients; please use the full client ID');
        err.statusCode = 400;
        throw err;
    }
    return match[0]._id;
};

/**
 * @desc    Create a new project
 * @route   POST /api/projects
 * @access  Freelancer only
 */
const createProject = async (req, res, next) => {
    try {
        const resolvedClientId = await resolveClientId(req.body.clientId);
        const data = {
            ...req.body,
            clientId: resolvedClientId,
            freelancerId: req.user._id,
        };

        const project = await projectService.createProject(data);

        res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get project by ID
 * @route   GET /api/projects/:id
 * @access  Authenticated
 */
const getProject = async (req, res, next) => {
    try {
        const project = await projectService.getProjectById(req.params.id);

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Approve a project (set to active)
 * @route   PATCH /api/projects/:id/approve
 * @access  Client only
 */
const approveProject = async (req, res, next) => {
    try {
        const project = await projectService.approveProject(
            req.params.id,
            req.user._id,
            { deadline: req.body.deadline }
        );

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Add a change request to a project
 * @route   POST /api/projects/:id/change-requests
 * @access  Authenticated
 */
const addChangeRequest = async (req, res, next) => {
    try {
        const data = {
            description: req.body.description,
            projectId: req.params.id,
        };
        if (req.body.priceAdjustment != null) data.priceAdjustment = req.body.priceAdjustment;
        if (req.body.timelineAdjustment != null) data.timelineAdjustment = req.body.timelineAdjustment;

        const changeRequest = await projectService.addChangeRequest(data);

        res.status(201).json({
            success: true,
            data: changeRequest,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Freelancer classifies a change request (in-scope / out-of-scope)
 * @route   PATCH /api/projects/:id/change-requests/:changeRequestId/classify
 * @access  Freelancer only
 */
const classifyChangeRequest = async (req, res, next) => {
    try {
        const cr = await projectService.classifyChangeRequest(
            req.params.id,
            req.params.changeRequestId,
            req.user._id,
            req.body
        );
        res.status(200).json({ success: true, data: cr });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Increment revision counter
 * @route   PATCH /api/projects/:id/revisions
 * @access  Authenticated
 */
const incrementRevision = async (req, res, next) => {
    try {
        const project = await projectService.incrementRevision(req.params.id);

        res.status(200).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get user's assigned projects
 * @route   GET /api/projects
 * @access  Authenticated
 */
const getUserProjects = async (req, res, next) => {
    try {
        const projects = await projectService.getUserProjects(req.user._id, req.user.role);

        res.status(200).json({
            success: true,
            data: projects,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Submit a deliverable (link or file upload)
 * @route   POST /api/projects/:id/deliverables
 * @access  Freelancer only
 */
const addDeliverable = async (req, res, next) => {
    try {
        let data = { ...req.body };
        if (req.file) {
            data.link = '/uploads/' + req.file.filename;
            data.type = 'file';
            data.title = data.title || req.file.originalname;
        }
        const project = await projectService.addDeliverable(req.params.id, req.user._id, data);

        res.status(201).json({
            success: true,
            data: project,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Client accepts a deliverable
 * @route   PATCH /api/projects/:id/deliverables/:deliverableId/accept
 * @access  Client only
 */
const acceptDeliverable = async (req, res, next) => {
    try {
        const project = await projectService.acceptDeliverable(
            req.params.id,
            req.params.deliverableId,
            req.user._id
        );
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Client requests revision for a deliverable
 * @route   PATCH /api/projects/:id/deliverables/:deliverableId/request-revision
 * @access  Client only
 */
const requestDeliverableRevision = async (req, res, next) => {
    try {
        const feedback = req.body.feedback || '';
        const project = await projectService.requestDeliverableRevision(
            req.params.id,
            req.params.deliverableId,
            req.user._id,
            feedback
        );
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Client marks project complete (all deliverables accepted). Updates trust score & scope metrics.
 * @route   PATCH /api/projects/:id/complete
 * @access  Client only
 */
const completeProject = async (req, res, next) => {
    try {
        const project = await projectService.completeProject(req.params.id, req.user._id);
        res.status(200).json({ success: true, data: project });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get messages for a project (client or freelancer only)
 * @route   GET /api/projects/:id/messages
 */
const getProjectMessages = async (req, res, next) => {
    try {
        const messages = await projectService.getProjectMessages(req.params.id, req.user._id);
        res.status(200).json({ success: true, data: messages });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Send a message in a project (client or freelancer only)
 * @route   POST /api/projects/:id/messages
 */
const sendProjectMessage = async (req, res, next) => {
    try {
        const message = await projectService.sendProjectMessage(
            req.params.id,
            req.user._id,
            req.body.content
        );
        res.status(201).json({ success: true, data: message });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProject,
    getProject,
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

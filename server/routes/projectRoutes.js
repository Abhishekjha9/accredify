const express = require('express');
const { body } = require('express-validator');
const {
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
} = require('../controllers/projectController');
const auth = require('../middleware/auth');
const roleGuard = require('../middleware/roleGuard');
const validate = require('../middleware/validate');
const upload = require('../middleware/upload');

const router = express.Router();

// All project routes require authentication
router.use(auth);

// @route   POST /api/projects
// @access  Freelancer only
router.post(
    '/',
    roleGuard('freelancer'),
    [
        body('clientId').notEmpty().withMessage('Client ID is required'),
        body('title').trim().notEmpty().withMessage('Title is required'),
        body('scopeChecklist')
            .isArray()
            .withMessage('Scope checklist must be an array'),
        body('revisionLimit')
            .isInt({ min: 0 })
            .withMessage('Revision limit must be a non-negative integer'),
    ],
    validate,
    createProject
);

// @route   GET /api/projects
router.get('/', getUserProjects);

// @route   GET /api/projects/:id
router.get('/:id', getProject);

// @route   POST /api/projects/:id/deliverables
// @access  Freelancer only (link or file upload)
router.post(
    '/:id/deliverables',
    roleGuard('freelancer'),
    upload.single('file'),
    [
        body('title').optional().trim(),
        body('link').optional().trim(),
        body('description').optional().trim(),
        body('type').optional().isIn(['link', 'file']).withMessage('Type must be link or file'),
    ],
    (req, res, next) => {
        if (req.file) return next();
        if (!req.body || !req.body.link || !req.body.title) {
            return res.status(400).json({
                success: false,
                errors: [{ field: 'link', message: 'Title and link are required when not uploading a file' }],
            });
        }
        next();
    },
    validate,
    addDeliverable
);

// @route   PATCH /api/projects/:id/deliverables/:deliverableId/accept
router.patch('/:id/deliverables/:deliverableId/accept', roleGuard('client'), acceptDeliverable);

// @route   PATCH /api/projects/:id/deliverables/:deliverableId/request-revision
router.patch(
    '/:id/deliverables/:deliverableId/request-revision',
    roleGuard('client'),
    [body('feedback').optional().trim()],
    validate,
    requestDeliverableRevision
);

// @route   PATCH /api/projects/:id/approve
// @access  Client only
router.patch('/:id/approve', roleGuard('client'), approveProject);

// @route   POST /api/projects/:id/change-requests
// @access  Client only (logs change; freelancer marks scope later)
router.post(
    '/:id/change-requests',
    roleGuard('client'),
    [
        body('description').trim().notEmpty().withMessage('Description is required'),
        body('priceAdjustment')
            .optional()
            .isNumeric()
            .withMessage('Price adjustment must be a number'),
        body('timelineAdjustment')
            .optional()
            .isNumeric()
            .withMessage('Timeline adjustment must be a number'),
    ],
    validate,
    addChangeRequest
);

// @route   PATCH /api/projects/:id/change-requests/:changeRequestId/classify
// @access  Freelancer only (marks scope)
router.patch(
    '/:id/change-requests/:changeRequestId/classify',
    roleGuard('freelancer'),
    [
        body('classification')
            .isIn(['in-scope', 'out-of-scope'])
            .withMessage('Classification must be in-scope or out-of-scope'),
        body('priceAdjustment')
            .optional()
            .isNumeric()
            .withMessage('Price adjustment must be a number'),
        body('timelineAdjustment')
            .optional()
            .isNumeric()
            .withMessage('Timeline adjustment must be a number'),
    ],
    validate,
    classifyChangeRequest
);

// @route   PATCH /api/projects/:id/revisions
router.patch('/:id/revisions', incrementRevision);

module.exports = router;

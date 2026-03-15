const { runCommand } = require('../services/aiCommandService');
const { getProjectCountsForUser, getProjectListForUser } = require('../services/projectService');

/**
 * POST /api/ai/command
 * Body: { message: string, context?: { route: string } }
 * Returns: { success, data: { actions: Array } }
 */
const handleCommand = async (req, res, next) => {
    try {
        const { message, context: bodyContext = {} } = req.body || {};
        const context = {
            ...bodyContext,
            user: req.user ? {
                name: req.user.name,
                role: req.user.role,
                trustScore: req.user.trustScore,
                scopeDiscipline: req.user.scopeDiscipline,
                scopeCreepIndex: req.user.scopeCreepIndex,
            } : null,
        };
        if (req.user?.role && req.user?.id) {
            try {
                const uid = req.user._id || req.user.id;
                context.projects = await getProjectCountsForUser(uid, req.user.role);
                context.projectList = await getProjectListForUser(uid, req.user.role);
            } catch (_) {
                context.projects = null;
                context.projectList = null;
            }
        } else {
            context.projects = null;
            context.projectList = null;
        }
        const actions = await runCommand(message, context);
        res.status(200).json({
            success: true,
            data: { actions },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { runCommand: handleCommand };

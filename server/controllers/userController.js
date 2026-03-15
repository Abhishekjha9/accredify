const User = require('../models/User');
const projectService = require('../services/projectService');

/**
 * @desc    Search/list freelancers (for clients to find and message)
 * @route   GET /api/users/freelancers
 * @query   q - optional search by name
 */
const getFreelancers = async (req, res, next) => {
    try {
        const q = (req.query.q || '').trim();
        const filter = { role: 'freelancer' };
        if (q) {
            filter.name = { $regex: q, $options: 'i' };
        }
        const freelancers = await User.find(filter)
            .select('name email role trustScore scopeDiscipline scopeCreepIndex createdAt')
            .sort({ name: 1 })
            .limit(50)
            .lean();
        res.status(200).json({ success: true, data: freelancers });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get public profile of a user (by id) - for viewing freelancer profile
 * @route   GET /api/users/:id
 */
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .select('name role trustScore scopeDiscipline scopeCreepIndex createdAt')
            .lean();
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get projects between current user (client) and this freelancer
 * @route   GET /api/users/:id/projects
 */
const getFreelancerProjectsForClient = async (req, res, next) => {
    try {
        const freelancerId = req.params.id;
        const clientId = req.user._id;
        const profileUser = await User.findById(freelancerId).select('role').lean();
        if (!profileUser || profileUser.role !== 'freelancer') {
            return res.status(404).json({ success: false, message: 'Freelancer not found' });
        }
        if (req.user.role !== 'client') {
            return res.status(403).json({ success: false, message: 'Only clients can view a freelancer\'s project list' });
        }
        const projects = await projectService.getProjectsWithFreelancerForClient(freelancerId, clientId);
        res.status(200).json({ success: true, data: projects });
    } catch (error) {
        next(error);
    }
};

module.exports = { getFreelancers, getUserProfile, getFreelancerProjectsForClient };

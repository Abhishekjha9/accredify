const User = require('../models/User');

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

module.exports = { getFreelancers, getUserProfile };

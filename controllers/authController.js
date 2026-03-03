const authService = require('../services/authService');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        const result = await authService.registerUser({ name, email, password, role });

        res.status(201).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const result = await authService.loginUser(email, password);

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

/**
 * @desc    Get current authenticated user
 * @route   GET /api/auth/me
 */
const getMe = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            id: req.user._id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            trustScore: req.user.trustScore,
            scopeDiscipline: req.user.scopeDiscipline,
            scopeCreepIndex: req.user.scopeCreepIndex,
            disputeRatio: req.user.disputeRatio,
            trustVelocity: req.user.trustVelocity,
        },
    });
};

module.exports = {
    register,
    login,
    getMe,
};

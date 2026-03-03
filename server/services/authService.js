const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Generate a signed JWT for a given user ID.
 */
const generateToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
};

/**
 * Register a new user and return user data + token.
 */
const registerUser = async ({ name, email, password, role }) => {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        const error = new Error('Email is already registered');
        error.statusCode = 400;
        throw error;
    }

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            trustScore: user.trustScore,
        },
        token,
    };
};

/**
 * Authenticate user with email & password, return user data + token.
 */
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    const token = generateToken(user._id);

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            trustScore: user.trustScore,
        },
        token,
    };
};

module.exports = {
    registerUser,
    loginUser,
    generateToken,
};

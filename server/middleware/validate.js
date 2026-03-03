const { validationResult } = require('express-validator');

/**
 * Middleware that checks express-validator results.
 * Returns 400 with errors array if validation fails.
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map((err) => ({
                field: err.path,
                message: err.msg,
            })),
        });
    }

    next();
};

module.exports = validate;

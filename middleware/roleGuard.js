/**
 * Role-based access control middleware.
 * @param  {...string} allowedRoles - Roles permitted to access the route.
 */
const roleGuard = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied — requires one of: ${allowedRoles.join(', ')}`,
            });
        }

        next();
    };
};

module.exports = roleGuard;

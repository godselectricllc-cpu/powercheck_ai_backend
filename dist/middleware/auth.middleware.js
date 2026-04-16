"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
function authenticate(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const payload = (0, jwt_1.verifyToken)(token);
        if (payload.type !== 'access') {
            return res.status(401).json({ message: 'Invalid token type' });
        }
        req.user = {
            id: payload.userId,
            role: payload.role,
        };
        return next();
    }
    catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
function requireRole(roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden' });
        }
        return next();
    };
}

"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = register;
exports.login = login;
exports.refresh = refresh;
exports.me = me;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const jwt_1 = require("../utils/jwt");
const SALT_ROUNDS = 10;
async function register(req, res) {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const existing = await prisma_1.default.user.findUnique({ where: { email } });
        if (existing) {
            return res.status(409).json({ message: 'Email already in use' });
        }
        const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const user = await prisma_1.default.user.create({
            data: {
                email,
                passwordHash,
                role: role || 'TECHNICIAN',
            },
        });
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id, user.role);
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(201).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (err) {
        console.error('Register error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const valid = await bcrypt_1.default.compare(password, user.passwordHash);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }
        const accessToken = (0, jwt_1.signAccessToken)(user.id, user.role);
        const refreshToken = (0, jwt_1.signRefreshToken)(user.id, user.role);
        await prisma_1.default.refreshToken.create({
            data: {
                token: refreshToken,
                userId: user.id,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(200).json({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
            accessToken,
            refreshToken,
        });
    }
    catch (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
async function refresh(req, res) {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }
        const stored = await prisma_1.default.refreshToken.findUnique({
            where: { token: refreshToken },
            include: { user: true },
        });
        if (!stored || stored.expiresAt < new Date()) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }
        const payload = (0, jwt_1.verifyToken)(refreshToken);
        if (payload.type !== 'refresh') {
            return res.status(401).json({ message: 'Invalid token type' });
        }
        const accessToken = (0, jwt_1.signAccessToken)(stored.userId, stored.user.role);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(stored.userId, stored.user.role);
        await prisma_1.default.refreshToken.delete({ where: { id: stored.id } });
        await prisma_1.default.refreshToken.create({
            data: {
                token: newRefreshToken,
                userId: stored.userId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            },
        });
        return res.status(200).json({
            accessToken,
            refreshToken: newRefreshToken,
        });
    }
    catch (err) {
        console.error('Refresh error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
async function me(req, res) {
    try {
        if (!req.user) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        return res.status(200).json({ user });
    }
    catch (err) {
        console.error('Me error:', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}
